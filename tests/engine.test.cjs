const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../prototype/engine.js');
const T = 1000000;
const send = (s, type, props = {}) => E.reduce(s, { type, now: s.now, ...props });
const accepted = () => send(E.create('normal', T), 'ACCEPT');

test('S01: emergency warning appears before screening or consent and blocks suggestion', () => {
  const s = E.create('emergency', T);
  assert.equal(s.route, 'urgent'); assert.equal(s.warning, true); assert.equal(s.candidate, null);
  assert.ok(E.incomplete(s.patient).length > 0); assert.equal(s.consent, false);
  assert.equal(s.handoff.status, 'queued'); assert.match(s.messages.at(-1).text, /đừng chờ/);
});
test('S01: transfer failure cannot suppress warning or allow suggestion', () => {
  let s = send(E.create('emergency', T), 'ONLINE', { value: false });
  assert.equal(s.handoff.status, 'failed'); assert.equal(s.warning, true); assert.equal(E.canApprove(s), false);
  s = send(s, 'APPROVE', { revision: s.revision }); assert.equal(s.candidate, null);
});
test('S01: cancelling a queued handoff does not retract urgent advice', () => {
  const s = send(E.create('emergency', T), 'CANCEL_TRANSFER');
  assert.equal(s.handoff.status, 'cancelled'); assert.equal(s.route, 'urgent'); assert.equal(s.warning, true);
});
test('S01: an intake edit cannot silently downgrade an earlier urgent warning', () => {
  const s = send(E.create('emergency', T), 'UPDATE_PATIENT', { patch: { danger: 'no' } });
  assert.equal(s.route, 'urgent'); assert.equal(s.candidate, null);
});
test('S02: pregnancy correction withdraws the legacy card and creates a current handoff', () => {
  let s = E.create('correction', T); const oldRevision = s.revision;
  s = send(s, 'PREGNANCY_CORRECTION');
  assert.equal(s.corrected, true); assert.equal(s.withdrawn, true); assert.equal(s.patient.pregnancy, 'pregnant');
  assert.equal(s.route, 'protected'); assert.equal(s.candidate, null); assert.ok(s.revision > oldRevision);
  assert.equal(s.handoff.revision, s.revision); assert.equal(s.handoff.status, 'queued');
});
test('S02: accepting a protected case does not authorize product release', () => {
  let s = send(send(E.create('correction', T), 'PREGNANCY_CORRECTION'), 'ACCEPT');
  s = send(s, 'APPROVE', { revision: s.revision });
  assert.equal(s.candidate, null); assert.match(s.error, /Không thể duyệt/);
});
test('S02: already-used status is preserved for the receiver, with a new information version', () => {
  let s = send(E.create('correction', T), 'PREGNANCY_CORRECTION'); const rev = s.revision;
  s = send(s, 'TAKEN', { value: 'yes' });
  assert.equal(s.taken, 'yes'); assert.ok(s.revision > rev); assert.equal(s.handoff.revision, s.revision);
  assert.equal(s.candidate, null); assert.equal(s.withdrawn, true);
});
test('S03: a normal complete case waits for an identified receiver and approval', () => {
  let s = E.create('normal', T);
  assert.equal(E.incomplete(s.patient).length, 0); assert.equal(s.candidate.status, 'pending');
  s = send(s, 'APPROVE', { revision: s.revision }); assert.equal(s.candidate.status, 'pending');
  s = send(s, 'ACCEPT'); assert.equal(E.canApprove(s), true);
  s = send(s, 'APPROVE', { revision: s.revision }); assert.equal(s.candidate.status, 'approved');
});
test('approval cannot be replayed across a changed information version', () => {
  let s = accepted(); const oldRevision = s.revision;
  s = send(s, 'UPDATE_PATIENT', { patch: { duration: '3' } });
  s = send(s, 'ACCEPT'); s = send(s, 'APPROVE', { revision: oldRevision });
  assert.equal(s.candidate.status, 'pending'); assert.match(s.error, /Không thể duyệt/);
});
test('an approved suggestion is removed when new patient information changes risk', () => {
  let s = accepted(); s = send(s, 'APPROVE', { revision: s.revision });
  s = send(s, 'UPDATE_PATIENT', { patch: { group: 'child', age: '5' } });
  assert.equal(s.route, 'protected'); assert.equal(s.candidate, null); assert.equal(s.withdrawn, true);
});
test('approval expires at the exact deadline even if a prior timer tick was skipped', () => {
  let s = accepted(); const at = s.candidate.expiresAt;
  s = E.reduce(s, { type: 'APPROVE', revision: s.revision, now: at });
  assert.equal(s.candidate.status, 'pending'); assert.match(s.error, /Không thể duyệt/);
});
test('timeout marks a queued transfer overdue without claiming it was received', () => {
  let s = E.create('normal', T); s = send(s, 'TICK', { now: T + E.REVIEW_MS });
  assert.equal(s.handoff.status, 'overdue'); assert.equal(s.candidate.status, 'expired');
  assert.ok(!s.messages.some(m => m.role === 'staff'));
});
test('a timed-out normal case can be retried and approved under a new deadline', () => {
  let s = send(E.create('normal', T), 'TICK', { now: T + E.REVIEW_MS });
  const oldId = s.handoff.id; s = send(s, 'TRANSFER');
  assert.notEqual(s.handoff.id, oldId); assert.equal(s.candidate.status, 'pending');
  s = send(s, 'ACCEPT'); s = send(s, 'APPROVE', { revision: s.revision }); assert.equal(s.candidate.status, 'approved');
});
test('repeated transfers while queued do not create duplicate receiver tickets', () => {
  let s = E.create('normal', T); const id = s.handoff.id;
  for (let i = 0; i < 5; i++) s = send(s, 'TRANSFER');
  assert.equal(s.handoff.id, id); assert.equal(s.transferCount, 1);
});
test('receiver acceptance is forbidden after timeout and while offline', () => {
  let s = E.create('normal', T); s = send(s, 'ACCEPT', { now: T + E.REVIEW_MS }); assert.notEqual(s.handoff.status, 'accepted');
  s = send(E.create('normal', T), 'ONLINE', { value: false }); s = send(s, 'ACCEPT'); assert.notEqual(s.handoff.status, 'accepted');
});
test('a queued transfer is cancellable, an accepted transfer is not falsely undone', () => {
  let s = send(E.create('normal', T), 'CANCEL_TRANSFER'); assert.equal(s.handoff.status, 'cancelled');
  s = send(s, 'TRANSFER'); s = send(s, 'ACCEPT'); s = send(s, 'CANCEL_TRANSFER'); assert.equal(s.handoff.status, 'accepted');
});
test('notes cannot be saved without an explicit separate consent', () => {
  let s = send(E.create('normal', T), 'SAVE_NOTE'); assert.equal(s.savedNote, null);
  s = send(s, 'CONSENT', { value: true }); s = send(s, 'SAVE_NOTE'); assert.equal(s.savedNote.revision, s.revision);
  s = send(s, 'DELETE_NOTE'); assert.equal(s.savedNote, null); assert.equal(s.consent, false);
});
test('withdrawing consent deletes a previously saved in-memory note', () => {
  let s = send(send(E.create('normal', T), 'CONSENT', { value: true }), 'SAVE_NOTE');
  s = send(s, 'CONSENT', { value: false }); assert.equal(s.savedNote, null);
});
test('changing information invalidates the saved snapshot and requires consent again', () => {
  let s = send(send(E.create('normal', T), 'CONSENT', { value: true }), 'SAVE_NOTE');
  s = send(s, 'UPDATE_PATIENT', { patch: { duration: '3' } }); assert.equal(s.savedNote, null); assert.equal(s.consent, false);
});
test('consent is also invalidated when information changes before the first save', () => {
  let s = send(E.create('normal', T), 'CONSENT', { value: true });
  s = send(s, 'UPDATE_PATIENT', { patch: { duration: '3' } });
  assert.equal(s.consent, false); s = send(s, 'SAVE_NOTE'); assert.equal(s.savedNote, null);
});
test('a new free-text message also invalidates consent before the first save', () => {
  let s = send(E.create('normal', T), 'CONSENT', { value: true });
  s = send(s, 'MESSAGE', { text: 'Một thông tin mới chưa có trong bản tóm tắt.' });
  assert.equal(s.consent, false); s = send(s, 'SAVE_NOTE'); assert.equal(s.savedNote, null);
});
for (const caseKey of ['emergency', 'correction']) {
  test(caseKey + ': separate consent and deletion work on the actual expensive case', () => {
    let s = E.create(caseKey, T);
    if (caseKey === 'correction') s = send(s, 'PREGNANCY_CORRECTION');
    assert.equal(s.consent, false); assert.equal(s.savedNote, null);
    s = send(s, 'SAVE_NOTE'); assert.equal(s.savedNote, null);
    s = send(send(s, 'CONSENT', { value: true }), 'SAVE_NOTE'); assert.equal(s.savedNote.revision, s.revision);
    s = send(s, 'DELETE_NOTE'); assert.equal(s.savedNote, null); assert.equal(s.consent, false);
    assert.equal(s.candidate, null);
  });
}
test('S02: no emergency is claimed without a supported sign, and a new danger message warns immediately', () => {
  let s = send(E.create('correction', T), 'PREGNANCY_CORRECTION');
  assert.equal(s.warning, false); assert.equal(s.route, 'protected');
  s = send(s, 'MESSAGE', { text: 'Mình đang khó thở.' });
  assert.equal(s.route, 'urgent'); assert.equal(s.warning, true); assert.equal(s.candidate, null);
});
test('prescription sales are forbidden even when the handler is called directly', () => {
  const s = send(E.create('prescription', T), 'SELL_PRESCRIPTION');
  assert.equal(s.route, 'blocked'); assert.equal(s.candidate, null); assert.match(s.error, /bị cấm/);
  assert.equal(s.events.at(-1).result, 'forbidden');
});
test('inventory is not invented when the track has no inventory tool', () => {
  const s = E.create('inventory', T); assert.equal(s.route, 'no-source'); assert.equal(s.candidate, null);
  assert.match(s.messages.at(-1).text, /không có công cụ hay dữ liệu tồn kho/);
});
test('missing, invalid and contradictory screening cannot unlock suggestions', () => {
  let s = E.create('normal', T);
  for (const patch of [{ age: '' }, { age: 'NaN' }, { recipient: 'invented' }, { danger: 'false' }, { age: '5', group: 'adult' }]) {
    const next = send(s, 'UPDATE_PATIENT', { patch }); assert.equal(E.canApprove(next), false); assert.notEqual(next.route, 'review');
  }
});
test('unknown free text withdraws previous approval and routes to a person', () => {
  let s = accepted(); s = send(s, 'APPROVE', { revision: s.revision });
  s = send(s, 'MESSAGE', { text: 'Một yêu cầu lạ mà bản mẫu không hiểu.' });
  assert.equal(s.route, 'unknown'); assert.equal(s.candidate, null); assert.equal(s.withdrawn, true);
});
test('unseen free text with a supported danger phrase triggers an immediate warning', () => {
  let s = E.create('ambiguous', T); s = send(s, 'MESSAGE', { text: 'Bố mình đau ngực, khó thở, có thuốc gì không?' });
  assert.equal(s.route, 'urgent'); assert.equal(s.candidate, null); assert.equal(s.warning, true);
});
test('a child with a different danger phrase does not acquire invented symptoms from S01', () => {
  let s = send(E.create('ambiguous', T), 'UPDATE_PATIENT', { patch: { group: 'child', age: '5' } });
  s = send(s, 'MESSAGE', { text: 'Bé đau ngực.' });
  assert.equal(s.route, 'urgent');
  assert.doesNotMatch(s.messages.at(-1).text, /bé khó thở và lơ mơ/);
});
test('simple negations are not treated as supported positive danger phrases', () => {
  assert.equal(E.dangerWords('Mình không khó thở, không lơ mơ.'), false);
  assert.equal(E.dangerWords('Không sốt nhưng khó thở.'), true);
});
test('clock rollback cannot revive an expired approval', () => {
  let s = send(accepted(), 'TICK', { now: T + E.REVIEW_MS });
  s = send(s, 'APPROVE', { revision: s.revision, now: T }); assert.equal(s.candidate.status, 'expired');
});
test('reset starts a new demonstration clock after fast-forwarding an old session', () => {
  let s = send(E.create('normal', T), 'TICK', { now: T + E.REVIEW_MS * 3 });
  s = send(s, 'RESET', { caseKey: 'normal', now: T });
  assert.equal(s.now, T); assert.equal(s.candidate.expiresAt, T + E.REVIEW_MS);
  s = send(s, 'TICK', { now: T + E.REVIEW_MS }); assert.equal(s.handoff.status, 'overdue');
});
test('new session has no retained consent, notes, approvals or receiver state', () => {
  let s = send(send(E.create('normal', T), 'CONSENT', { value: true }), 'SAVE_NOTE');
  s = send(s, 'RESET', { caseKey: 'ambiguous' });
  assert.equal(s.savedNote, null); assert.equal(s.consent, false); assert.equal(s.candidate, null); assert.equal(s.handoff, null);
});
