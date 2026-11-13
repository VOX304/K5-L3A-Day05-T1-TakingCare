(function () {
  'use strict';
  const E = window.CareEngine;
  const $ = sel => document.querySelector(sel);
  const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n = num => '<span class="marker" aria-label="Chú thích ' + num + '">' + num + '</span>';
  let offset = 0;
  let s = E.create('emergency');
  let screen = 'customer';
  let tickSignature = '';
  const now = () => Date.now() + offset;
  const routeNames = { urgent: 'Cần hỗ trợ khẩn', intake: 'Cần thêm thông tin', protected: 'Cần dược sĩ trao đổi', review: 'Chờ người có chuyên môn', blocked: 'Ngoài quyền của AI', 'no-source': 'Chưa có nguồn xác nhận', unknown: 'Chưa hiểu đủ yêu cầu mới' };
  const handoffNames = { queued: 'Đã xếp vào hàng chờ mô phỏng', accepted: 'Dược sĩ mô phỏng đã nhận', failed: 'Chưa chuyển được · mô phỏng', overdue: 'Quá hạn chờ · chưa có người nhận', cancelled: 'Đã huỷ yêu cầu chuyển', superseded: 'Thông tin cũ không còn hiệu lực' };
  function dispatch(event) { s = E.reduce(s, { ...event, now: now() }); window.__careState = s; render(); }
  function switchScreen(value) {
    screen = value;
    for (const name of ['customer', 'staff']) {
      $('#' + name).hidden = name !== value;
      $('#tab-' + name).setAttribute('aria-selected', String(name === value));
      $('#tab-' + name).tabIndex = name === value ? 0 : -1;
    }
    render();
  }
  function remaining() {
    const deadline = s.candidate?.expiresAt || s.handoff?.deadline;
    const sec = Math.max(0, Math.ceil(((deadline || s.now) - s.now) / 1000));
    return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
  }
  function evidence() {
    return '<div class="evidence">' + n(3) + '<strong>Căn cứ đang dùng</strong><ul><li>Tin khách vừa cung cấp · phiên ' + s.revision + '.</li><li>Quy tắc T1: nhóm nhạy cảm cần dược sĩ; dấu hiệu nguy hiểm không chờ chat.</li><li>Không có danh mục thuốc, liều, giá hay tồn kho trong dữ liệu bài.</li></ul></div>';
  }
  function handoff(forStaff = false) {
    if (!s.handoff) return '<div class="status-box amber"><strong>Chưa chuyển ca</strong><p>Chưa có dược sĩ nào nhận. Bạn có thể yêu cầu chuyển ngay.</p></div><button class="btn secondary full" data-action="transfer">Nhờ dược sĩ hỗ trợ</button>';
    const h = s.handoff;
    const retry = ['failed', 'overdue', 'cancelled', 'superseded'].includes(h.status) || s.candidate?.status === 'expired';
    return '<div class="status-box ' + (retry ? 'amber' : '') + '"><strong>' + escape(h.status === 'accepted' && !s.online ? 'Đã nhận · hiện không có người trực' : handoffNames[h.status]) + '</strong><p>' + h.id + ' · bản thông tin ' + h.revision + (h.status === 'queued' ? ' · mốc chờ <time data-clock>' + remaining() + '</time>' : '') + '</p><p>' + (s.route === 'urgent' ? 'Cảnh báo khẩn vẫn có hiệu lực. Không chờ dược sĩ trong chat.' : 'Mốc 2 phút là chính sách dựng để thử quá hạn, không phải cam kết thời gian phục vụ thật.') + '</p></div><div class="row">' + (retry ? '<button class="btn secondary" data-action="transfer">Gửi lại yêu cầu mô phỏng</button>' : '') + (h.status === 'queued' ? '<button class="btn secondary" data-action="cancel-transfer">Huỷ yêu cầu chuyển</button>' : '') + '<button class="btn quiet" data-action="' + (forStaff ? 'customer' : 'staff') + '">' + (forStaff ? '← Xem phía khách' : 'Xem phía dược sĩ →') + '</button></div>';
  }
  function summaryHTML() { return '<dl class="summary">' + E.summary(s).map(([key, value]) => '<div><dt>' + escape(key) + '</dt><dd>' + escape(value) + '</dd></div>').join('') + '</dl>'; }
  function field(key, label, options) {
    return '<label class="form-field">' + label + '<select name="' + key + '">' + options.map(([value, text]) => '<option value="' + value + '"' + (s.patient[key] === value ? ' selected' : '') + '>' + text + '</option>').join('') + '</select></label>';
  }
  function intakeForm() {
    const yesNo = [['unknown', 'Chưa biết'], ['none', 'Không theo khai báo'], ['yes', 'Có']];
    return '<details class="details" id="intake-details"><summary>' + n(5) + 'Xem / sửa thông tin người sẽ dùng</summary><form id="intake-form"><div class="form-grid">' +
      field('recipient', 'Ai sẽ dùng?', [['unknown', 'Chưa biết'], ['self', 'Bản thân'], ['other', 'Người nhà']]) +
      field('group', 'Nhóm người dùng', [['unknown', 'Chưa biết'], ['adult', 'Người lớn'], ['child', 'Trẻ nhỏ'], ['older', 'Người lớn tuổi']]) +
      '<label class="form-field">Tuổi (dữ liệu dựng)<input type="number" min="0.1" max="125" step="0.1" name="age" value="' + escape(s.patient.age) + '"></label>' +
      field('pregnancy', 'Thai kỳ / cho con bú', [['unknown', 'Chưa biết'], ['none', 'Không / không áp dụng'], ['pregnant', 'Đang mang thai'], ['breastfeeding', 'Đang cho con bú']]) +
      field('medications', 'Thuốc đang dùng', yesNo) + field('conditions', 'Bệnh nền', yesNo) + field('allergy', 'Dị ứng', yesNo) +
      '<label class="form-field">Triệu chứng bao lâu (ngày)?<input type="number" min="0" step="0.5" name="duration" value="' + escape(s.patient.duration) + '"></label>' +
      field('prior', 'Đã tự dùng sản phẩm trước đó?', yesNo) +
      field('danger', 'Có dấu hiệu nguy hiểm?', [['unknown', 'Chưa xác định'], ['no', 'Chưa ghi nhận theo khai báo'], ['yes', 'Có / nghi có']]) +
      '</div><p class="micro">Không cần hoàn tất các mục này để thấy cảnh báo khẩn. Tuổi và thời gian chỉ là dữ liệu dựng, không phải kết luận y tế.</p><button class="btn secondary full" type="submit">Cập nhật và kiểm tra lại quyền hành động</button></form></details>';
  }
  function privacy() {
    return '<section class="card"><div class="card-head"><h2>' + n(7) + 'Bạn quyết định việc lưu</h2><span class="pill ' + (s.savedNote ? '' : 'amber') + '">' + (s.savedNote ? 'Đã lưu trong trang' : 'Chưa lưu hồ sơ') + '</span></div><div class="card-body"><p class="subtle">Nội dung hỗ trợ hiện tại khác với việc giữ ghi chú cho lần sau.</p><label class="consent"><input id="consent" type="checkbox"' + (s.consent ? ' checked' : '') + '> Tôi đồng ý lưu bản tóm tắt đang xem. Trong bản mẫu, ghi chú chỉ nằm trong bộ nhớ trang và mất khi tải lại.</label><p class="consent-copy">Chỉ lưu các trường sàng lọc trong bản tóm tắt; không tên, số điện thoại, địa chỉ. Không đồng ý vẫn được hỗ trợ. Sửa thông tin sẽ xoá ghi chú cũ và cần đồng ý lại.</p><div class="row"><button class="btn secondary" data-action="save"' + (!s.consent ? ' disabled' : '') + '>Lưu ghi chú mô phỏng</button>' + (s.savedNote ? '<button class="btn quiet" data-action="delete">Rút đồng ý & xoá</button>' : '') + '</div></div></section>';
  }
  function legacyCard(readOnly = false) {
    if (!s.legacy && !s.withdrawn) return '';
    return '<div class="legacy ' + (s.withdrawn ? 'withdrawn' : '') + '">' + n(4) + '<span class="pill ' + (s.withdrawn ? 'red' : 'amber') + '">' + (s.withdrawn ? 'Gợi ý cũ đã thu hồi' : 'Lịch sử lỗi được dựng') + '</span><h3>Thẻ gợi ý cũ · không phải thuốc thật</h3><p>' + (s.withdrawn ? 'Không thể dùng gợi ý hay phê duyệt cũ để đặt sản phẩm. Thu hồi thẻ không đảo ngược được việc đã dùng thuốc.' : 'AI trước đó đã gợi ý khi chưa đủ thông tin. Không có nút mua trong bản học này.') + '</p>' + (s.legacy && !s.corrected && !readOnly ? '<button class="btn secondary" data-action="correct">Bổ sung: Mình đang bầu 3 tháng</button>' : '') + (s.corrected ? '<p><strong>Đã dùng sản phẩm từ gợi ý cũ chưa?</strong></p>' + (readOnly ? '' : '<div class="row"><button class="btn secondary" data-action="taken-no"' + (s.taken === 'no' ? ' disabled' : '') + '>Chưa dùng</button><button class="btn secondary" data-action="taken-yes"' + (s.taken === 'yes' ? ' disabled' : '') + '>Đã dùng · báo dược sĩ</button></div>') + '<p class="micro">Trạng thái: ' + ({ unknown: 'chưa xác định', yes: 'khách báo đã dùng, cần dược sĩ đánh giá; không hứa đảo ngược', no: 'khách báo chưa dùng' }[s.taken]) + '.</p>' : '') + '</div>';
  }
  function suggestion() {
    if (!s.candidate) return '';
    if (s.candidate.status === 'approved') return '<section class="suggestion"><span class="pill">Được duyệt trong mô phỏng</span><h3>THẺ MINH HOẠ A</h3><p>Đây không phải thuốc. Không có tên thuốc, liều hay tác dụng điều trị. Bản thông tin ' + s.revision + ' đã được dược sĩ mô phỏng duyệt trước khi gửi thẻ.</p><button class="btn secondary" data-action="revoke">Thu hồi thẻ chưa dùng</button></section>';
    const status = { pending: 'Chưa gửi gợi ý · đang chờ duyệt', expired: 'Đã hết hạn duyệt · chưa gửi thẻ', withdrawn: 'Thẻ đã thu hồi' }[s.candidate.status];
    return '<section class="legacy"><strong>' + escape(status) + '</strong><p>Không có thao tác mua. Cần dược sĩ nhận đúng bản thông tin và phê duyệt còn hiệu lực.</p></section>';
  }
  function customer() {
    const urgent = s.route === 'urgent';
    const warning = urgent ? '<section class="warning" role="alert"><h3>' + n(2) + 'Không chờ trong chat</h3><p>Thông tin có dấu hiệu có thể nguy hiểm. <span class="safe-action">Gọi cấp cứu 115 hoặc đến cơ sở cấp cứu ngay.</span> Không cần chờ dược sĩ duyệt hay đồng ý lưu hồ sơ.</p><button class="btn danger" data-action="emergency-help">Xem bước tiếp theo · không gọi thật</button><p id="emergency-help" class="micro" hidden>Bản mẫu không thực hiện cuộc gọi, không điều xe và không báo đã liên hệ được cấp cứu. Trong tình huống thật, hãy dùng điện thoại liên hệ 115 hoặc đến cơ sở cấp cứu.</p></section>' : '';
    return '<div><section class="card"><div class="card-head"><div class="identity"><span class="avatar" aria-hidden="true">+</span><div><h2>' + n(1) + 'Trợ lý Hỏi dược sĩ <span class="pill">AI mô phỏng</span></h2><small>Không chẩn đoán · không kê đơn · không tự nói liều</small></div></div></div><div class="conversation" aria-label="Nội dung cuộc trao đổi">' + s.messages.map(m => '<div class="message ' + m.role + '"><span class="speaker">' + ({ user: 'KHÁCH · TÌNH HUỐNG DỰNG', ai: 'TRỢ LÝ AI · MÔ PHỎNG', staff: 'DƯỢC SĨ · MÔ PHỎNG' }[m.role]) + '</span>' + escape(m.text) + '</div>').join('') + '</div>' + warning + legacyCard() + suggestion() + '<div class="card-body" style="padding-top:0">' + evidence() + '</div><form id="message-form" class="composer"><label for="message">Thử tin nhắn khác · chỉ nhập dữ liệu giả</label><textarea id="message" maxlength="800" placeholder="Ví dụ: Mình hỏi cho bố, nhưng chưa biết tên thuốc đang dùng..."></textarea><div class="row"><span class="micro">Tin lạ được chuyển người; không tự đoán thuốc.</span><button class="btn" type="submit">Gửi tin dựng →</button></div></form></section></div><aside><section class="card"><div class="card-head"><h2>Bước tiếp theo</h2><span class="pill ' + (urgent ? 'red' : 'amber') + '">' + s.caseId + '</span></div><div class="card-body"><p class="section-label">' + n(2) + 'Quyền hành động lúc này</p><h3 class="status-title">' + routeNames[s.route] + '</h3><p class="subtle">' + (urgent ? 'Cảnh báo đã hiện ngay. Gợi ý sản phẩm bị chặn.' : 'Chưa ghi nhận nguy hiểm không đồng nghĩa đã chứng minh an toàn. Thông tin thiếu được giữ rõ.') + '</p>' + handoff() + '</div></section><section class="card"><div class="card-head"><h2>' + n(5) + 'Người sẽ dùng thuốc</h2><small>Bản ' + s.revision + '</small></div><div class="card-body">' + summaryHTML() + '</div>' + intakeForm() + '</section>' + privacy() + '</aside>';
  }
  function staff() {
    const canAccept = s.online && s.handoff?.status === 'queued';
    return '<div><section class="card"><div class="staff-hero"><span class="pill ' + (s.warning ? 'red' : '') + '">' + (s.warning ? 'Ưu tiên khẩn · không giữ khách chờ' : 'Phiếu hỗ trợ · mô phỏng') + '</span><h2>Tiếp nối, không bắt khách kể lại.</h2><p>Đây là góc nhìn người nhận ca trong bản học. Chưa có dược sĩ thật nhận thông tin.</p></div><div class="card-body"><div class="row" style="justify-content:space-between;margin-bottom:16px"><span class="section-label">' + (s.handoff?.id || 'Chưa có phiếu') + ' · bản thông tin ' + s.revision + '</span><label class="check"><input type="checkbox" id="online"' + (s.online ? ' checked' : '') + '> Có người trực (mô phỏng)</label></div>' + handoff(true) + '<hr style="border:0;border-top:1px solid var(--line);margin:20px 0"><h3 class="status-title">' + n(5) + 'Bản tóm tắt cần kiểm tra</h3>' + summaryHTML() + '<div class="audit-box" style="margin-top:14px"><strong>Câu hỏi gốc và cập nhật của khách</strong>' + s.messages.filter(m => m.role === 'user').map(m => '<p style="white-space:pre-wrap;overflow-wrap:anywhere">' + escape(m.text) + '</p>').join('') + '</div><p class="micro">' + (s.corrected ? 'Gợi ý cũ đã thu hồi. Khách báo đã dùng: ' + ({ unknown: 'chưa biết', yes: 'có — cần đánh giá trực tiếp', no: 'chưa dùng' }[s.taken]) + '.' : 'Chỉ là thông tin khách khai báo; không phải chẩn đoán hay xác minh độc lập.') + '</p><button class="btn quiet" data-action="customer">← Sửa thông tin ở phía khách</button></div></section></div><aside><section class="card"><div class="card-head"><h2>' + n(6) + 'Quyết định có thẩm quyền</h2><small>Mô phỏng vai trò</small></div><div class="decision"><div class="audit-box">Duyệt gắn với <strong>bản ' + s.revision + '</strong>. Thông tin đổi hoặc quá hạn làm duyệt cũ mất hiệu lực. Ca nguy hiểm và nhóm nhạy cảm không được duyệt thẻ minh hoạ tại đây.</div><div class="stack"><button class="btn secondary" data-action="accept"' + (!canAccept ? ' disabled' : '') + '>1. Nhận ca mô phỏng</button><button class="btn" data-action="approve" data-revision="' + s.revision + '"' + (!E.canApprove(s) ? ' disabled' : '') + '>2. Duyệt và gửi thẻ minh hoạ</button><button class="btn secondary" data-action="staff-reply"' + (!s.online || s.handoff?.status !== 'accepted' ? ' disabled' : '') + '>Cần trao đổi trực tiếp thêm</button></div><p class="micro">Không có thuốc hoặc liều thật. Ca nhóm nhạy cảm chỉ có đường trao đổi thêm; thao tác này không tạo đơn hay cho phép mua.</p></div></section>' + (s.withdrawn ? '<section class="card"><div class="card-body">' + legacyCard(true).replace('class="legacy withdrawn"', 'class="legacy withdrawn" style="margin:0"') + '</div></section>' : '') + '<section class="card"><div class="card-head"><h2>Ranh giới của 5 hành động</h2></div><div class="card-body"><ul class="rules"><li><div>Chuyển dược sĩ<small>Huỷ được trước lúc nhận</small></div><span class="pill">Tự làm</span></li><li><div>Cảnh báo đi khám<small>Không đợi hàng chờ</small></div><span class="pill">Tự làm</span></li><li><div>Gửi gợi ý sản phẩm<small>Dược sĩ duyệt đúng bản</small></div><span class="pill amber">Cần duyệt</span></li><li><div>Lưu ghi chú sức khoẻ<small>Khách đồng ý riêng</small></div><span class="pill amber">Cần duyệt</span></li><li><div>Bán thuốc kê đơn<small>Không có điều khiển thực hiện</small></div><span class="pill red">Cấm</span></li></ul></div></section><section class="card"><div class="card-head"><h2>Nhật ký trong phiên</h2><small>Không lưu ra ngoài</small></div><div class="card-body"><ol class="event-log">' + s.events.map(e => '<li>' + escape(e.action + ' · ' + e.result + ' · v' + e.revision) + '</li>').join('') + '</ol></div></section></aside>';
  }
  function render() {
    $('#case-code').textContent = s.caseId + ' / DỮ LIỆU DỰNG / BẢN ' + s.revision;
    if (screen === 'customer') $('#customer').innerHTML = customer();
    else $('#staff').innerHTML = staff();
    $('#error').hidden = !s.error;
    $('#error').textContent = s.error;
    tickSignature = [s.handoff?.status, s.candidate?.status].join('|');
    window.__careState = s;
  }
  $('#case').innerHTML = Object.entries(E.CASES).map(([key, value]) => '<option value="' + key + '">' + value.id + ' · ' + value.name + '</option>').join('');
  $('#case').addEventListener('change', e => { offset = 0; dispatch({ type: 'RESET', caseKey: e.target.value }); switchScreen('customer'); });
  $('#reset').addEventListener('click', () => { offset = 0; dispatch({ type: 'RESET', caseKey: $('#case').value }); });
  $('#expire').addEventListener('click', () => { offset += E.REVIEW_MS + 1000; dispatch({ type: 'TICK' }); });
  $('#annotations').addEventListener('change', e => document.body.classList.toggle('hide-annotations', !e.target.checked));
  for (const name of ['customer', 'staff']) {
    $('#tab-' + name).addEventListener('click', () => switchScreen(name));
    $('#tab-' + name).addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const target = e.key === 'Home' ? 'customer' : e.key === 'End' ? 'staff' : screen === 'customer' ? 'staff' : 'customer'; switchScreen(target); $('#tab-' + target).focus(); } });
  }
  document.addEventListener('submit', e => {
    if (e.target.id === 'message-form') { e.preventDefault(); dispatch({ type: 'MESSAGE', text: $('#message').value }); }
    if (e.target.id === 'intake-form') { e.preventDefault(); const patch = Object.fromEntries(new FormData(e.target)); dispatch({ type: 'UPDATE_PATIENT', patch }); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'consent') dispatch({ type: 'CONSENT', value: e.target.checked });
    if (e.target.id === 'online') dispatch({ type: 'ONLINE', value: e.target.checked });
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b || b.disabled) return;
    const actions = { transfer: { type: 'TRANSFER' }, 'cancel-transfer': { type: 'CANCEL_TRANSFER' }, correct: { type: 'PREGNANCY_CORRECTION' }, accept: { type: 'ACCEPT' }, approve: { type: 'APPROVE', revision: Number(b.dataset.revision) }, revoke: { type: 'REVOKE' }, 'staff-reply': { type: 'STAFF_REPLY' }, save: { type: 'SAVE_NOTE' }, delete: { type: 'DELETE_NOTE' }, 'taken-no': { type: 'TAKEN', value: 'no' }, 'taken-yes': { type: 'TAKEN', value: 'yes' } };
    if (b.dataset.action === 'staff' || b.dataset.action === 'customer') switchScreen(b.dataset.action);
    else if (b.dataset.action === 'emergency-help') $('#emergency-help').hidden = false;
    else if (actions[b.dataset.action]) dispatch(actions[b.dataset.action]);
  });
  setInterval(() => {
    const previous = tickSignature;
    s = E.reduce(s, { type: 'TICK', now: now() });
    window.__careState = s;
    if ([s.handoff?.status, s.candidate?.status].join('|') !== previous) render();
    else document.querySelectorAll('[data-clock]').forEach(el => { el.textContent = remaining(); });
  }, 1000);
  render();
})();
