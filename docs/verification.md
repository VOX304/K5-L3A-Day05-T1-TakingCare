# Đối chiếu yêu cầu và bằng chứng — TakingCare

## Kết quả đã quan sát

Ngày kiểm tra: **13/11/2026**, múi giờ Việt Nam. Kiểm tra bằng Node.js 24 và Chrome trên máy làm bài.

- **34 kiểm tra logic: PASS**, không thất bại. Chạy `node --test tests/engine.test.cjs` từ thư mục bài làm.
- **12 lượt kiểm tra tương tác: PASS**, không lỗi JavaScript và không yêu cầu HTTP/HTTPS ra ngoài trong các luồng đã thử. Chạy `node tests/browser.cjs`.
- Hai ảnh đã được tạo từ trình duyệt chạy thật và xem lại: không tràn nội dung, có số chú thích, trạng thái khẩn/thu hồi và quyền duyệt thể hiện rõ.
- Kích thước đã kiểm tra tự động: máy tính 1440 × 1100 và điện thoại 390 × 844, không tràn ngang. Không suy rộng thành mọi thiết bị hay kiểm định khả năng tiếp cận đầy đủ.
- Log tương tác thực tế: [browser-results.json](../prototype/evidence/browser-results.json). Tệp ghi thời điểm UTC; cộng 7 giờ để quy đổi sang giờ Việt Nam.

Đây là kết quả cơ chế **mô phỏng**. Nó không phải kiểm thử AI thật, xét duyệt y tế, thử với người dùng hay bằng chứng điều trị an toàn.

## Đối chiếu từng khối

| Yêu cầu | Bằng chứng đã kiểm tra | Kết luận trong phạm vi bài |
|---|---|---|
| R1 — Đúng lát cắt T1 | `spec.md` §1; cả hai màn hình phục vụ người hỏi thuốc/người nhận ca | Có |
| R1 — ≥3 việc không làm, có lý do | Năm giới hạn ở §1; không có gọi mạng, tên/liều thuốc hay nút bán | Có |
| R2 — ≥8 ca phủ 4 lớp | 13 ca S01–S13; có tin nhắn, lớp, tool/dữ liệu thiếu, hành vi tốt, mức hại | Có |
| R2 — Chọn hai ca và ca suýt chọn | §2 so sánh S01/S02 với S05, S07/S08 | Có lập luận, không khẳng định là lựa chọn duy nhất |
| R3 — Câu nguyên văn/UI/bước tiếp/ai nhận | §3 khớp `COPY` và luồng khách/dược sĩ; hai ảnh | Có |
| R3 — Phương án chọn và loại | Mỗi ca có ba phương án bị loại cùng lý do theo hậu quả | Có |
| R3 — Loại lỗi | S01 lỗi ngữ cảnh của thiết kế xếp hàng; S02 lỗi hệ thống; ví dụ lỗi thao tác có đường sửa | Có, không quy kết thiếu thông tin là lỗi khách |
| R3 — 2–3 HAX/PAIR | Đúng ba nguyên tắc G2, G10, G9; số ①–⑦ trên ảnh | Có |
| R3 — Câu chữ không cứu được | Gợi ý/duyệt cũ bị vô hiệu khi phiên thông tin đổi; có test duyệt cũ và thu hồi | Có |
| R4 — Đủ 5 tool | §4 và bảng quyền trên màn dược sĩ | Có |
| R4 — Cái giá sai, đảo lại, chờ | Bảng §4 cho từng tool, không dùng “AI giỏi” làm lý do | Có |
| R4 — Ai duyệt/thấy gì/quá hạn | Dược sĩ nhận trước duyệt; khách đồng ý riêng cho ghi chú; quá hạn chặn hành động | Có trong mô phỏng |
| R4 — Tool khó nhất và lựa chọn khác | A/B/C cho `goi_y_san_pham` | Có tự phản biện; không thay thế yêu cầu ba người thảo luận |
| R4 — Thử 2 ca đắt +1 bình thường | Test S01, S02, S03, duyệt sai phiên, hết hạn, dữ liệu mới | Có trong mô phỏng |
| R4 — Lời hứa sản phẩm đổi | §4 đối chiếu “AI chọn ngay” với hỗ trợ/sàng lọc/chuyển/duyệt | Có |
| R5 — 1–2 màn hình, bấm ca khó trọn flow | Hai tab; kiểm tra tương tác S01/S02 không sửa code giữa luồng | Có |
| R5 — Căn cứ/giới hạn | Nhãn AI, mục chưa biết, khung ③, không % dựng | Có |
| R5 — Tự làm/cần duyệt/cấm thể hiện đúng | Cảnh báo/chuyển, huỷ trước nhận, nhận/duyệt, consent/xoá; không nút bán | Có; cảnh báo khẩn không bị thu hồi như một giao dịch |
| R5 — Ảnh đánh số và lý do hiển thị | Hai PNG trong `prototype/evidence/`; bảng §5 | Có |
| R5 — Ghi rõ mock/AI thật | README, spec và giao diện đều nói mô phỏng | Có; không có AI thật |
| R6 — Ba tiêu chí Pass/Fail | P1/P2/P3 ở §6, chấm hai ca chính, có giới hạn còn lại | Có |
| R7 — Ca trẻ nhỏ/nguy hiểm | S01 chạy được trong kiểm tra logic và trình duyệt | Có bằng chứng diễn tập |
| R7 — Ca lạ do người ngoài đưa | Mẫu ghi sau demo để trống, S13 ghi tự dựng | Chưa diễn ra, không nhận đã đạt demo thật |
| R7 — Từng thành viên giải thích | Đã có kịch bản và vòng tự kiểm; người dùng chọn làm cá nhân | Ngoại lệ cá nhân; việc tự giải thích chưa được quan sát |
| Dữ liệu và an toàn T1 | Không thuốc/liều/giao dịch; sản phẩm, trạng thái, tuổi, triệu chứng giả | Có trong phạm vi bản mẫu |
| Định dạng bài | `spec.md`, `prototype/`, đúng hai ảnh, tài liệu hỗ trợ riêng | Có |
| Thông tin bài | L3A/T1/TakingCare/cá nhân do người học chọn; tác giả/mã giữ nguyên theo tên repo được cung cấp | Không suy đoán dấu họ tên |
| Repo mới, công khai, đúng tên | Cần đối chiếu trạng thái GitHub thực tế khi xuất bản | Theo trạng thái xuất bản ở cuối tài liệu |

## Kiểm tra nào chứng minh ba tiêu chí?

| Tiêu chí | Bằng chứng logic | Bằng chứng tương tác |
|---|---|---|
| P1 — Khẩn không chờ | S01 thiếu sàng lọc/consent vẫn cảnh báo; offline/huỷ không xoá; sửa không tự hạ; S02 tin mới khẩn kích hoạt ngay | S01 thấy cảnh báo trước thao tác; tắt người trực vẫn thấy cảnh báo; tin lạ có cụm hỗ trợ chuyển khẩn |
| P2 — Đúng quyền, đúng dữ liệu | S02 thu hồi; protected không duyệt; S03 nhận rồi duyệt; duyệt sai phiên/hết hạn bị chặn; kê đơn cấm; thiếu nguồn không bịa | S02 nhận nhưng không duyệt; S03 trước/sau duyệt; sửa thai kỳ; hết hạn/gửi lại; S05 không có nút bán |
| P3 — Sửa và quyền lưu | Cả S01 và S02: không lưu trước consent, lưu sau consent, xoá; thay thông tin xoá consent ngay cả trước lần lưu đầu; mới phiên không giữ hồ sơ | Form sửa; chuyển chưa nhận/đã nhận/quá hạn; checkbox mặc định tắt; lưu/rút/xoá; tải lại mất ghi chú |

## Các lỗi đã phát hiện và sửa khi làm

- Khởi động lại sau khi cho thời gian chạy nhanh từng giữ mốc giờ cũ, làm phép thử hết hạn sai. Đã tách reset phiên khỏi quy tắc không quay lùi giờ và thêm test.
- Consent từng chỉ bị xoá nếu đã có ghi chú; đã sửa để dữ liệu thay đổi luôn cần đồng ý lại, kể cả khách mới tích ô chưa lưu.
- Cảnh báo trẻ nhỏ từng dùng câu S01 cho mọi trẻ có dấu hiệu khác; đã giới hạn câu cụ thể cho đúng fixture S01 ban đầu và dùng câu chung không bịa triệu chứng cho các trường hợp khác.
- Sau quá hạn đã nhận ca nhưng chưa duyệt, cần đường gửi lại: đã có yêu cầu mới và hạn duyệt mới thay vì kẹt hoặc tự mở duyệt.

## Giới hạn chưa được chứng minh

Không xác nhận AI thật hiểu tin nhắn; không xác nhận chẩn đoán, danh mục sản phẩm, quyền chuyên môn, danh tính dược sĩ, SLA, lưu trữ hồ sơ thật, kiểm tra pháp lý hoặc hiệu quả khi người thật sử dụng. Bộ quy tắc từ khoá và luật tuổi/thời gian là dựng, không phải công cụ sàng lọc lâm sàng. Không có cuộc gọi cấp cứu hay gửi dữ liệu thật.

Điểm số do giảng viên quyết định. Bài không tự nhận bonus, demo đã xảy ra, nhóm ba người đã làm, người học đã hiểu toàn bộ hoặc đã nộp đúng hạn L3A.

## Trạng thái xuất bản

Repo dự kiến: `VOX304/K5-L3A-Day05-T1-TakingCare`. Bộ kiểm tra phê duyệt tự động đã chặn thao tác tạo và đăng bài vì chưa có sự đồng ý rõ ràng để công khai tên/mã học viên và các artifact tại địa chỉ này. Đã gửi tác giả câu hỏi xác nhận riêng; chưa đăng dữ liệu ra GitHub.

Chỉ đổi trạng thái thành đã xuất bản sau khi được phép, kiểm tra repo công khai, mã bài đã lên và truy cập không đăng nhập được. Chưa có bằng chứng đã nộp link cho giảng viên. Bản local và bản zip không thay thế yêu cầu URL công khai nếu vẫn giữ yêu cầu này.
