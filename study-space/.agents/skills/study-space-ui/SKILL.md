---
name: study-space-ui
description: Thiết kế, chỉnh sửa và kiểm tra giao diện Study Space trên desktop và mobile. Dùng khi thay đổi bố cục, nền động, icon, Pomodoro, thanh nhạc, YouTube, âm nền, việc cần làm, thống kê hoặc toàn màn hình.
---

# Thiết kế giao diện Study Space

## Bắt đầu

1. Đọc bản đặc tả `study-space-technical-specification.md` ở thư mục dự án và mở phần mã liên quan trong `study-space/`. Giao diện hiện dùng HTML, CSS và JavaScript thuần. Dùng cấu trúc hiện có khi sửa giao diện.
2. Dùng [Stark-Tech-Portfolio](https://github.com/aslams2020/Stark-Tech-Portfolio) làm nguồn tham khảo cho phân cấp thị giác, bố cục responsive và phản hồi khi tương tác. Tạo biến thể nguyên bản với không khí phòng học ấm. Dùng tài sản có sẵn của Study Space hoặc tài sản có quyền sử dụng.
3. Xác định trạng thái người dùng cần thấy trước khi sửa. Ví dụ, thẻ phông nền có trạng thái đang chọn, nút phát có trạng thái phát và tạm dừng, bảng việc có trạng thái rỗng và hoàn thành.

## Giao diện

- Để cảnh học tập chiếm phần lớn khung hình. Dùng tông hổ phách, kem, nâu ấm và lớp phủ tối vừa đủ để đọc được đồng hồ, chữ và icon trên cả nền sáng lẫn tối.
- Trên desktop, ưu tiên menu trái, Pomodoro ở giữa, tiến độ và việc cần làm bên phải, âm thanh ở dưới. Trên mobile, để đồng hồ và thao tác bắt đầu luôn dễ tới. Dùng bảng mở theo nhu cầu cho các chức năng phụ. Kiểm tra khi tên cảnh và tên bản nhạc dài.
- Dùng lại các icon nét trong `index.html`. Giữ nhãn tiếng Việt hoặc tên truy cập cho nút chỉ có icon. Thể hiện trạng thái bằng dấu chọn, đường viền hoặc đổi icon cùng với màu. Giữ focus bàn phím dễ thấy và vùng chạm đủ rộng.
- Giữ chuyển động nhẹ và hỗ trợ `prefers-reduced-motion`. Dùng lớp chuyển động hiện có trong `motion.js` cho hiệu ứng theo cảnh. Giữ ảnh tĩnh khi tắt hiệu ứng. Giữ các nút bấm nằm trên lớp chuyển động.
- Duy trì đường thoát khỏi toàn màn hình hoặc chế độ tập trung. Giữ chức năng chính có thể thao tác khi trình phát hoặc bảng phụ đang mở.

## Tích hợp và kiểm tra

- Dùng chung các biến màu và quy tắc responsive trong `style.css`. Khi thay đổi thành phần, kiểm tra các tham chiếu ID, biểu tượng và sự kiện trong `app.js`.
- Khi chỉnh phông nền hoặc âm thanh, kiểm tra chọn cảnh, phát nhạc, bật âm môi trường và đổi nguồn YouTube qua trình phát nhúng. Khi chỉnh đồng hồ hoặc thống kê, kiểm tra luồng từ bắt đầu phiên đến ghi phiên hợp lệ. Dùng dữ liệu thật hoặc trạng thái rỗng ở bản triển khai.
- Thử chiều rộng khoảng 390 px và 1440 px, một cảnh sáng và một cảnh tối, bàn phím, giảm chuyển động và toàn màn hình. Khi không thể dùng trình duyệt, kiểm tra cú pháp và các liên kết có thể xác minh, rồi ghi rõ phần chưa xem hoặc chưa chạy trực tiếp.
