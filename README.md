# TakingCare — LAB5 · T1 Y tế

Bài thực hành cá nhân lớp **L3A** về **trải nghiệm khi AI sai** và **mức tự chủ theo cái giá khi sai**. Hai màn hình mô phỏng một khách hỏi thuốc và dược sĩ nhận ca, không phải dịch vụ tư vấn y tế.

## Mở bài

1. Mở [prototype/index.html](prototype/index.html) bằng Chrome hoặc Edge. Không cần cài đặt, API key, đăng nhập hay máy chủ.
2. Đọc [spec.md](spec.md) để đối chiếu từng yêu cầu và lý do chọn thiết kế.
3. Đọc [giải thích nguyên lý và flow](docs/learning-guide.md), rồi thực hành theo [kịch bản demo](docs/demo.md).

### Thử trong ba phút

- **S01:** xem “Không chờ trong chat” dù hồ sơ còn thiếu. Sang phía dược sĩ, tắt “Có người trực”; về phía khách, cảnh báo vẫn còn.
- **S02:** bấm “Bổ sung: Mình đang bầu 3 tháng” → gợi ý cũ thu hồi → chọn đã/chưa dùng → sang dược sĩ nhận ca. Nút duyệt thẻ vẫn bị chặn.
- **S03:** sang dược sĩ → nhận ca → duyệt → về khách mới thấy thẻ minh hoạ. Sửa thai kỳ làm thẻ và duyệt cũ mất hiệu lực.
- Thử quá hạn, huỷ chuyển trước lúc nhận, đồng ý lưu/xoá và tin tự do không có trong các ca dựng.

## Bài gồm gì?

| Tệp | Mục đích |
|---|---|
| [spec.md](spec.md) | 13 kịch bản, hai ca đắt nhất, UX khi sai, quyền của năm tool, nguyên tắc, tiêu chí và trạng thái demo |
| [prototype/](prototype/) | Bản mẫu hai màn hình, chạy ngay trên máy |
| [Hai ảnh đánh số](prototype/README.md) | Đối chiếu số chú thích với G2/G10/G9 |
| [docs/learning-guide.md](docs/learning-guide.md) | Giải thích cách đi từ rủi ro đến flow và cách tự bảo vệ lập luận |
| [docs/demo.md](docs/demo.md) | Bài nói 4 phút, ca để tự thử và câu hỏi kiểm tra hiểu |
| [docs/verification.md](docs/verification.md) | Kết quả chạy thật, phạm vi bằng chứng và phần chưa hoàn tất |
| [GLOSSARY.md](GLOSSARY.md) | Thuật ngữ thống nhất: người nhắn/người dùng thuốc, tự chủ, duyệt, thu hồi |
| [docs/adr/](docs/adr/) | Lý do giữ các ranh giới quan trọng của thiết kế |
| [tests/](tests/) | Kiểm tra logic và tương tác trình duyệt |

## Mức tự chủ đã chọn

| Hành động | Mức |
|---|---|
| Chuyển dược sĩ | Tự làm, có trạng thái thật trong mô phỏng và huỷ trước lúc nhận |
| Cảnh báo cần đi khám/cấp cứu | Tự làm, không đợi duyệt |
| Gửi gợi ý sản phẩm | Cần dược sĩ duyệt đúng thông tin và còn hạn |
| Lưu ghi chú sức khoẻ | Cần khách đồng ý riêng, rút lại/xoá được |
| Bán thuốc kê đơn | Cấm trong chat tự động |

**Quan trọng:** bản mẫu không có thuốc, liều hoặc danh mục sản phẩm thật. Thẻ minh hoạ chỉ dùng kiểm tra thứ tự duyệt/gửi. AI, dược sĩ và việc chuyển/lưu đều được mô phỏng; nội dung không gửi đi đâu. Thông tin chỉ nằm trong bộ nhớ trang và mất khi tải lại.

## Chạy kiểm tra — chỉ khi muốn kiểm tra mã

Cần Node.js. Kiểm tra logic không cần thư viện ngoài:

```text
npm test
```

Kiểm tra nút, hai màn hình, quyền lưu và tạo lại hai ảnh:

```text
npm install --ignore-scripts --no-audit --no-fund
npm run test:browser
```

Trình kiểm tra dùng Chrome đã cài ở đường dẫn mặc định Windows. Máy khác đặt biến `CHROME_PATH` trỏ tới trình duyệt Chromium/Chrome tương thích. `playwright-core` chỉ phục vụ kiểm tra, không cần để mở prototype.

## Trạng thái bài nộp

- Đã chọn **T1, L3A, làm cá nhân** theo xác nhận của người học. Đề gốc yêu cầu nhóm ba người; bài ghi ngoại lệ này rõ ràng.
- Tác giả ghi `VoCongMinh`, mã `2A202603520` theo tên repo được cung cấp; không đoán dấu. Tên bài **TakingCare**, bàn/zone **cá nhân** do người học chọn. Không có thành viên, phân công hoặc tranh luận nhóm bịa.
- Chưa có demo trước TA/giảng viên hay ca lạ từ người ngoài; không nhận bonus đó. Không có lời gọi AI thật; không nhận bonus AI.
- Thư mục này được chuẩn bị để đưa vào **repo GitHub mới, công khai**, tên `K5-L3A-Day05-T1-TakingCare`. Đang chờ tác giả đồng ý công khai tên/mã học viên và bài làm tại địa chỉ mới; chưa tạo repo hay nộp link.
- Đề gốc đặt hạn L3A là **23:59 ngày 12/11/2026**. Bài đang được chuẩn bị ngày 13/11/2026; không có bằng chứng nộp đúng hạn.

Đây là bài học thiết kế với bối cảnh Hỏi dược sĩ. Không liên kết với Pharmacity, không dùng dữ liệu sức khoẻ thật, không thay thế người có chuyên môn.
