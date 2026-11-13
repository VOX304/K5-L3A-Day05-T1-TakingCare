(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CareEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const REVIEW_MS = 120000;
  const blank = () => ({ recipient: 'unknown', group: 'unknown', age: '', pregnancy: 'unknown', medications: 'unknown', conditions: 'unknown', allergy: 'unknown', duration: '', prior: 'unknown', danger: 'unknown' });
  const adult = () => ({ recipient: 'self', group: 'adult', age: '28', pregnancy: 'none', medications: 'none', conditions: 'none', allergy: 'none', duration: '2', prior: 'none', danger: 'no' });
  const CASES = {
    emergency: { id: 'S01', name: 'Trẻ nhỏ · cần hỗ trợ khẩn', message: 'Con mình 5 tuổi sốt, giờ khó thở với lơ mơ, có thuốc gì không?', patient: { recipient: 'other', group: 'child', age: '5', danger: 'yes' } },
    correction: { id: 'S02', name: 'Thông tin mới · thu hồi gợi ý cũ', message: 'Mình đau rát họng 2 ngày, có thuốc gì không?', patient: { ...adult(), pregnancy: 'unknown' }, legacy: true },
    normal: { id: 'S03', name: 'Người lớn · chờ dược sĩ duyệt', message: 'Mình 28 tuổi, đau rát họng 2 ngày. Mình đã trả lời đủ các mục sàng lọc trong ca dựng.', patient: adult() },
    ambiguous: { id: 'S04', name: 'Tin nhắn thiếu thông tin', message: 'đau họng quá, cho loại nào nhanh đi', patient: {} },
    prescription: { id: 'S05', name: 'Yêu cầu ngoài quyền', message: 'Bán kháng sinh cho mình, không có đơn, hoặc cho thuốc thay thế cũng được.', patient: {}, request: 'prescription' },
    inventory: { id: 'S06', name: 'Không có nguồn tồn kho', message: 'Pharmacity gần mình còn nước muối sinh lý không, tối mình qua lấy.', patient: {}, request: 'inventory' },
    older: { id: 'S07', name: 'Hỏi cho người nhà lớn tuổi', message: 'Mình hỏi cho mẹ lớn tuổi, mẹ đang uống thuốc kê đơn, có loại nào đỡ ho không?', patient: { recipient: 'other', group: 'older', age: '70', medications: 'yes', danger: 'unknown' } }
  };
  const COPY = {
    emergency: 'Bạn mô tả bé khó thở và lơ mơ. Đây có thể là dấu hiệu nguy hiểm. Hãy gọi cấp cứu 115 hoặc đưa bé đến cơ sở cấp cứu ngay; đừng chờ trả lời trong chat. Mình không gợi ý thuốc. Yêu cầu hỗ trợ dược sĩ được xử lý song song, không thay thế cấp cứu.',
    emergencyGeneric: 'Thông tin bạn cung cấp có dấu hiệu có thể nguy hiểm. Nếu bạn hoặc người nhà đang có dấu hiệu đó, hãy gọi cấp cứu 115 hoặc đến cơ sở cấp cứu ngay; đừng chờ trả lời trong chat. Mình không chẩn đoán và không gợi ý thuốc. Yêu cầu hỗ trợ dược sĩ được xử lý song song, không thay thế cấp cứu.',
    correction: 'Mình đã gợi ý khi chưa biết bạn đang mang thai; đó là thiếu sót của hệ thống. Gợi ý cũ đã bị thu hồi và không còn dùng để đặt sản phẩm. Đừng dùng gợi ý đó làm căn cứ chọn thuốc. Bạn đã dùng sản phẩm từ gợi ý cũ chưa? Mình chuyển thông tin này cho dược sĩ; nếu có dấu hiệu nguy hiểm, hãy tìm hỗ trợ cấp cứu ngay, không chờ chat.',
    missing: 'Mình chưa biết đủ về người sẽ dùng thuốc nên chưa thể đưa gợi ý. Bạn đang hỏi cho mình hay cho người khác? Bạn có thể sửa các thông tin bên cạnh; mình không tự đặt hay bán thuốc.',
    review: 'Mình đã có các mục sàng lọc của ca dựng, nhưng chưa thể kết luận sản phẩm nào phù hợp. Một thẻ minh hoạ đang chờ dược sĩ duyệt. Chưa có gợi ý được gửi để đặt sản phẩm.',
    protected: 'Thông tin bạn cung cấp cần được dược sĩ xem trực tiếp. Mình chưa gửi gợi ý sản phẩm. Bạn có thể kiểm tra và sửa bản tóm tắt để không phải kể lại từ đầu.',
    prescription: 'Mình không bán thuốc kê đơn hoặc gợi ý thuốc thay thế qua chat tự động. Mình có thể chuyển câu hỏi cho dược sĩ; chưa có đơn thuốc hay sản phẩm nào được đặt.',
    inventory: 'Mình không có công cụ hay dữ liệu tồn kho theo cửa hàng trong bài này, nên không thể xác nhận còn hàng, giá hay giờ nhận. Mình chuyển câu hỏi để nhân viên kiểm tra; chưa giữ hay đặt sản phẩm.',
    unknown: 'Mình chưa hiểu đủ yêu cầu mới này để trả lời chắc chắn. Mình sẽ nhờ dược sĩ xem, không tự suy đoán thuốc, liều hoặc tác dụng. Nếu đang có dấu hiệu nguy hiểm, đừng chờ chat.'
  };
  const clone = x => JSON.parse(JSON.stringify(x));
  function incomplete(p) {
    const allowed = { recipient: ['self', 'other'], group: ['adult', 'child', 'older'], pregnancy: ['none', 'pregnant', 'breastfeeding'], medications: ['none', 'yes'], conditions: ['none', 'yes'], allergy: ['none', 'yes'], prior: ['none', 'yes'], danger: ['no', 'yes'] };
    return Object.keys(blank()).filter(key => {
      if (key === 'age') return p.age === '' || !Number.isFinite(Number(p.age)) || Number(p.age) <= 0 || Number(p.age) > 125;
      if (key === 'duration') return p.duration === '' || !Number.isFinite(Number(p.duration)) || Number(p.duration) < 0;
      return !allowed[key].includes(p[key]);
    });
  }
  function protectedPatient(p) {
    return ['child', 'older'].includes(p.group) || (p.age !== '' && (Number(p.age) < 18 || Number(p.age) >= 60)) || ['pregnant', 'breastfeeding'].includes(p.pregnancy) || p.medications === 'yes' || p.conditions === 'yes' || p.allergy === 'yes' || p.prior === 'yes' || Number(p.duration) > 3;
  }
  function dangerWords(text) {
    let t = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
    t = t.replace(/\b(khong|chua)\s+(?:(bi|co|con|thay)\s+)?(kho tho|lo mo|dau nguc|bat tinh|co giat)\b/g, ' ');
    return /\b(kho tho|lo mo|dau nguc|bat tinh|khong tinh|co giat)\b/.test(t);
  }
  function label(s) {
    if (s.patient.danger === 'yes' || s.warning) return 'urgent';
    if (s.request === 'prescription') return 'blocked';
    if (s.request === 'inventory') return 'no-source';
    if (s.corrected || protectedPatient(s.patient)) return 'protected';
    if (s.request === 'unknown') return 'unknown';
    if (incomplete(s.patient).length) return 'intake';
    return 'review';
  }
  function append(s, role, text) { s.messages.push({ role, text }); }
  function log(s, action, result, now) { s.events.push({ action, result, revision: s.revision, at: now }); }
  function transfer(s, now) {
    if (s.handoff && ['queued', 'accepted'].includes(s.handoff.status)) return;
    s.handoff = { id: 'HS-' + String(++s.transferCount).padStart(3, '0'), status: s.online ? 'queued' : 'failed', revision: s.revision, at: now, deadline: now + REVIEW_MS };
    log(s, 'chuyen_duoc_si', s.online ? 'queued (mô phỏng)' : 'failed (mô phỏng)', now);
  }
  function route(s, now, speak = true) {
    s.route = label(s);
    if (s.route === 'urgent') {
      s.warning = true;
      s.candidate = null;
      transfer(s, now);
      if (speak) append(s, 'ai', s.caseKey === 'emergency' && s.revision === 1 ? COPY.emergency : COPY.emergencyGeneric);
      log(s, 'khuyen_di_kham', 'immediate', now);
    } else if (s.route === 'review') {
      s.candidate = { revision: s.revision, status: 'pending', expiresAt: now + REVIEW_MS };
      transfer(s, now);
      if (speak) append(s, 'ai', COPY.review);
    } else {
      s.candidate = null;
      if (s.route !== 'intake') transfer(s, now);
      if (speak) append(s, 'ai', s.corrected ? COPY.correction : COPY[{ intake: 'missing', protected: 'protected', blocked: 'prescription', 'no-source': 'inventory', unknown: 'unknown' }[s.route]]);
    }
  }
  function create(caseKey = 'emergency', now = Date.now()) {
    const fixture = CASES[caseKey] || CASES.emergency;
    const s = { caseKey, caseId: fixture.id, revision: 1, now, patient: { ...blank(), ...clone(fixture.patient) }, request: fixture.request || 'normal', legacy: !!fixture.legacy, withdrawn: false, corrected: false, taken: 'unknown', warning: false, online: true, candidate: null, handoff: null, transferCount: 0, consent: false, savedNote: null, messages: [], events: [], error: '' };
    append(s, 'user', fixture.message);
    if (s.legacy) append(s, 'ai', 'Lịch sử lỗi được dựng: trước đó AI đã đưa một thẻ gợi ý khi chưa sàng lọc đủ. Thẻ trong bài học không phải thuốc thật và không có thao tác mua. Hãy bấm bổ sung thông tin để kiểm tra cách sửa.');
    route(s, now, !s.legacy);
    return s;
  }
  function invalidate(s, now) {
    s.revision++;
    if (s.candidate) s.withdrawn = true;
    s.candidate = null;
    if (s.legacy) s.withdrawn = true;
    if (s.handoff) { s.handoff.status = 'superseded'; log(s, 'vo_hieu_duyet_cu', 'information changed', now); }
    s.consent = false;
    if (s.savedNote) { s.savedNote = null; log(s, 'luu_ghi_chu_suc_khoe', 'cleared after correction', now); }
  }
  function summary(s) {
    const p = s.patient;
    const words = { self: 'Bản thân', other: 'Người nhà', unknown: 'Chưa biết', adult: 'Người lớn', child: 'Trẻ nhỏ', older: 'Người lớn tuổi', none: 'Không theo khai báo', no: 'Chưa ghi nhận theo khai báo', yes: 'Có', pregnant: 'Đang mang thai', breastfeeding: 'Đang cho con bú' };
    const value = v => words[v] || v || 'Chưa biết';
    return [ ['Người sẽ dùng', value(p.recipient)], ['Nhóm / tuổi', value(p.group) + (p.age ? ' · ' + p.age + ' tuổi' : '')], ['Thai kỳ / cho con bú', value(p.pregnancy)], ['Thuốc đang dùng', value(p.medications)], ['Bệnh nền', value(p.conditions)], ['Dị ứng', value(p.allergy)], ['Thời gian triệu chứng', p.duration ? p.duration + ' ngày' : 'Chưa biết'], ['Đã dùng gì trước đó', value(p.prior)], ['Dấu hiệu nguy hiểm', value(p.danger)] ];
  }
  function canApprove(s) {
    return s.online && s.route === 'review' && s.candidate?.status === 'pending' && s.candidate.revision === s.revision && s.now < s.candidate.expiresAt && s.handoff?.status === 'accepted' && !s.warning && incomplete(s.patient).length === 0 && !protectedPatient(s.patient);
  }
  function reduce(state, event) {
    const s = clone(state);
    const now = event.type === 'RESET' ? (event.now ?? Date.now()) : Math.max(s.now, event.now ?? s.now);
    s.now = now;
    s.error = '';
    if (event.type === 'RESET') return create(event.caseKey, now);
    if (event.type === 'TICK') {
      if (s.candidate?.status === 'pending' && now >= s.candidate.expiresAt) { s.candidate.status = 'expired'; log(s, 'goi_y_san_pham', 'approval expired, no suggestion sent', now); }
      if (s.handoff?.status === 'queued' && now >= s.handoff.deadline) { s.handoff.status = 'overdue'; log(s, 'chuyen_duoc_si', 'overdue, no acceptance claimed', now); }
    } else if (event.type === 'UPDATE_PATIENT') {
      const patch = event.patch || {};
      const changed = Object.keys(patch).some(k => Object.hasOwn(s.patient, k) && s.patient[k] !== patch[k]);
      if (!changed) return s;
      invalidate(s, now);
      for (const key of Object.keys(s.patient)) if (Object.hasOwn(patch, key)) s.patient[key] = String(patch[key]);
      if (s.legacy && ['pregnant', 'breastfeeding'].includes(s.patient.pregnancy)) s.corrected = true;
      append(s, 'user', event.message || 'Mình đã sửa thông tin người sẽ dùng trong bản tóm tắt.');
      route(s, now);
    } else if (event.type === 'PREGNANCY_CORRECTION') {
      return reduce(s, { type: 'UPDATE_PATIENT', patch: { pregnancy: 'pregnant' }, message: 'Mình đang bầu 3 tháng. Gợi ý vừa rồi có dùng được không?', now });
    } else if (event.type === 'MESSAGE') {
      const text = String(event.text || '').trim().slice(0, 800);
      if (!text) return s;
      append(s, 'user', text);
      // Unseen free text is not treated as clinically understood or safe.
      invalidate(s, now);
      s.request = 'unknown';
      if (dangerWords(text)) s.patient.danger = 'yes';
      route(s, now);
    } else if (event.type === 'TRANSFER') {
      if (s.route === 'review' && s.candidate?.status === 'expired' && s.handoff) s.handoff.status = 'superseded';
      transfer(s, now);
      if (s.route === 'review' && (!s.candidate || ['expired', 'withdrawn'].includes(s.candidate.status))) s.candidate = { revision: s.revision, status: 'pending', expiresAt: now + REVIEW_MS };
    } else if (event.type === 'CANCEL_TRANSFER') {
      if (s.handoff?.status === 'queued') { s.handoff.status = 'cancelled'; s.candidate = null; log(s, 'chuyen_duoc_si', 'cancelled before acceptance', now); }
    } else if (event.type === 'ACCEPT') {
      if (s.online && s.handoff?.status === 'queued' && s.handoff.revision === s.revision && now < s.handoff.deadline) {
        s.handoff.status = 'accepted'; log(s, 'chuyen_duoc_si', 'accepted by simulated pharmacist', now);
        append(s, 'staff', 'Dược sĩ mô phỏng đã nhận bản tóm tắt phiên hiện tại. Đây không phải thông báo có dược sĩ thật tiếp nhận.');
      } else s.error = 'Yêu cầu chưa sẵn sàng hoặc đã quá hạn; hãy gửi lại. Chưa ghi nhận người nhận.';
    } else if (event.type === 'APPROVE') {
      if (event.revision !== s.revision || !canApprove(s)) { s.error = 'Không thể duyệt: thông tin thiếu, đã đổi, thuộc nhóm cần tư vấn trực tiếp hoặc phê duyệt hết hạn.'; log(s, 'goi_y_san_pham', 'blocked', now); }
      else {
        s.candidate.status = 'approved'; log(s, 'goi_y_san_pham', 'illustration released after approval', now);
        append(s, 'staff', 'Dược sĩ mô phỏng đã duyệt THẺ MINH HOẠ A. Đây không phải thuốc hay lời khuyên điều trị; không có thao tác đặt mua thật.');
      }
    } else if (event.type === 'REVOKE') {
      if (s.candidate) { s.candidate.status = 'withdrawn'; s.withdrawn = true; log(s, 'goi_y_san_pham', 'withdrawn; no ingestion reversal claimed', now); }
    } else if (event.type === 'STAFF_REPLY') {
      if (s.online && s.handoff?.status === 'accepted') append(s, 'staff', 'Dược sĩ mô phỏng cần trao đổi trực tiếp thêm trước khi có đề xuất. Chưa có thuốc, liều hoặc đơn nào được phát hành trong bài học.');
    } else if (event.type === 'ONLINE') {
      s.online = !!event.value;
      if (!s.online) {
        if (s.handoff?.status === 'queued') s.handoff.status = 'failed';
        if (s.candidate?.status === 'pending') s.candidate.status = 'expired';
      }
      log(s, 'trang_thai_nhan_ca', s.online ? 'online (simulation)' : 'offline (simulation)', now);
    } else if (event.type === 'CONSENT') {
      s.consent = !!event.value;
      if (!s.consent) s.savedNote = null;
    } else if (event.type === 'SAVE_NOTE') {
      if (!s.consent) { s.error = 'Chưa có đồng ý riêng; chưa lưu ghi chú.'; log(s, 'luu_ghi_chu_suc_khoe', 'blocked without consent', now); }
      else { s.savedNote = { revision: s.revision, fields: summary(s), at: now }; log(s, 'luu_ghi_chu_suc_khoe', 'saved in page memory only', now); }
    } else if (event.type === 'DELETE_NOTE') {
      s.savedNote = null; s.consent = false; log(s, 'luu_ghi_chu_suc_khoe', 'deleted from page memory', now);
    } else if (event.type === 'TAKEN') {
      const value = ['yes', 'no'].includes(event.value) ? event.value : 'unknown';
      if (value === s.taken) return s;
      invalidate(s, now);
      s.taken = value;
      log(s, 'bo_sung_thong_tin_cho_duoc_si', 'taken status updated', now);
      route(s, now, false);
    } else if (event.type === 'SELL_PRESCRIPTION') {
      s.error = 'Hành động bị cấm: không bán thuốc kê đơn trong chat tự động.';
      log(s, 'ban_thuoc_ke_don', 'forbidden', now);
    }
    return s;
  }
  return { REVIEW_MS, CASES, COPY, create, reduce, incomplete, protectedPatient, dangerWords, summary, canApprove };
});
