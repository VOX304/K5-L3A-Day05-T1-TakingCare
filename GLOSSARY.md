# LAB5 — Thiết kế sản phẩm AI khi sai và mức tự chủ

Các thuật ngữ dưới đây diễn giải cách dùng trong đề LAB5. Chúng mô tả bài học chung, chưa thể hiện lựa chọn thiết kế riêng của một nhóm.

## Language

**Lát cắt**:
Một tình huống có một người dùng, một công việc, một quyết định của AI và một kết quả cần đạt. Đây là phạm vi tính năng được track cấp sẵn.
_Avoid_: Toàn bộ sản phẩm, toàn bộ chatbot.

**Kịch bản rủi ro**:
Một tình huống người dùng cụ thể trong đó xác định được AI có thể sai thế nào và một sản phẩm tốt nên ứng xử ra sao. Khả năng sai phải có căn cứ từ hành động AI được phép làm hoặc dữ liệu của track.
_Avoid_: Nhận xét chung "AI có thể sai".

**Cái giá khi sai (cost-of-error)**:
Hậu quả một quyết định sai gây ra cho các bên, gồm thiệt hại, khả năng khôi phục và công sức khắc phục. Việc chờ duyệt hoặc từ chối nhầm cũng có cái giá cần cân nhắc.
_Avoid_: Chỉ tính độ chính xác câu trả lời.

**Mức tự chủ**:
Phạm vi quyền hành động của AI đối với từng việc, được nhóm xếp thành tự làm, cần người duyệt hoặc cấm. Đây là quyết định về quyền hạn, không phải thước đo năng lực hay độ tự tin của AI.
_Avoid_: Độ thông minh, độ chắc chắn.

**Người duyệt**:
Khách hàng hoặc nhân viên có thẩm quyền xác nhận một hành động trước khi nó được thực hiện. Danh tính, thông tin người này cần thấy và hệ quả khi không duyệt kịp phải được làm rõ trong thiết kế.
_Avoid_: Một người bất kỳ bấm đồng ý.

**Nguồn căn cứ**:
Dữ liệu hoặc tài liệu cụ thể dùng để kiểm tra một nhận định hay quyết định của AI. Việc có nguồn không bảo đảm nguồn luôn đúng; track giáo dục có tình huống tài liệu sai.
_Avoid_: Nội dung có vẻ hợp lý, nguồn được mặc định đúng tuyệt đối.

**UX khi AI sai**:
Trải nghiệm người dùng khi AI thiếu căn cứ, không chắc, mắc lỗi hoặc bị người dùng sửa. Trải nghiệm này gồm lời nói, thông tin hiển thị, bước tiếp theo và người nhận xử lý.
_Avoid_: Chỉ viết lời xin lỗi.

**Lỗi ngữ cảnh**:
Trường hợp hệ thống vận hành đúng như được thiết kế nhưng kết quả không phù hợp tình huống hay nhu cầu thực của người dùng. Cách khắc phục có thể cần thay đổi thiết kế thay vì chỉ đổi câu chữ.
_Avoid_: Lỗi cảm nhận — cách gọi xuất hiện không nhất quán tại checklist §3 của guide.

**Khả năng đảo lại**:
Khả năng khôi phục trạng thái hoặc quyền lợi sau một hành động, với thời hạn, chi phí và giới hạn cụ thể. Một nút hoàn tác trên bản mẫu chưa chứng minh quyền lợi thực sự khôi phục được.
_Avoid_: Có nút hoàn tác là chắc chắn sửa được.

**Chuyển người xử lý**:
Việc bàn giao một tình huống cho người có thẩm quyền, kèm bối cảnh và trạng thái để tiếp tục giải quyết. Lời hứa đã chuyển phải tương ứng với việc bàn giao thực sự xảy ra trong hệ thống được thiết kế.
_Avoid_: Chỉ nói "đã báo" khi chưa có bàn giao.

**Bằng chứng thiết kế**:
Căn cứ kiểm tra được cho một lập luận, trỏ về hành động, dữ liệu, bối cảnh track hoặc vị trí cụ thể trên prototype. Trong bài lab, khái niệm này không bắt buộc đồng nghĩa với log chạy AI thật.
_Avoid_: Khẳng định không có chỗ đối chiếu.

**Prototype LAB5**:
Bản mô phỏng tương tác nhỏ để người xem kiểm tra cách xử lý ca khó và quyền hành động của AI. Nó chưa chứng minh tính khả thi của mọi lời hứa trong một sản phẩm vận hành thực tế.
_Avoid_: Sản phẩm hoàn chỉnh, hệ thống AI đã được kiểm chứng.

## T1 — Hỏi dược sĩ

**Người nhắn**:
Người đang trao đổi với trợ lý; họ có thể hỏi cho bản thân hoặc một người khác. Thông tin của người nhắn không tự động là thông tin của người sẽ dùng sản phẩm.
_Avoid_: Mặc định người nhắn là người dùng thuốc.

**Người sẽ dùng thuốc**:
Người chịu tác động trực tiếp của sản phẩm được hỏi, có thể là trẻ nhỏ, người thân lớn tuổi hoặc người mang thai. Đây là chủ thể mà thông tin sàng lọc cần mô tả.
_Avoid_: Khách hàng — khi từ này không phân biệt được người nhắn và người dùng thuốc.

**Ca có dấu hiệu nguy hiểm**:
Tình huống có thông tin cho thấy cần được cơ sở y tế đánh giá khẩn, theo quy tắc an toàn của track. Cảnh báo này không phải một chẩn đoán và không phụ thuộc việc hoàn tất hàng chờ tư vấn.
_Avoid_: Ca chờ dược sĩ xác nhận mới được cảnh báo.

**Đồng ý lưu ghi chú sức khoẻ**:
Quyết định riêng của khách cho phép giữ lại những thông tin sức khoẻ đã chỉ rõ trong hồ sơ, ngoài việc dùng chúng để xử lý cuộc trao đổi hiện tại. Việc gửi tin nhắn hoặc đồng ý nhận hỗ trợ không tự động là đồng ý lưu hồ sơ.
_Avoid_: Tiếp tục chat nghĩa là đồng ý lưu.
