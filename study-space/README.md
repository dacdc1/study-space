# Study Space

Mở `index.html` trong trình duyệt để xem bản chạy thử. Để thử với một địa chỉ ổn định cho dữ liệu trình duyệt, chạy từ thư mục này:

```sh
python3 -m http.server 8000
```

Mở http://localhost:8000. Để xem trên điện thoại cùng mạng, mở địa chỉ IP nội bộ của máy tính ở cổng 8000. Ứng dụng dùng HTML, CSS và JavaScript thuần, không cần cài gói.

## Dùng thử luồng chính

1. Chọn một trong sáu phông nền.
2. Bấm phát nhạc rồi mở **Âm thanh** để bật mưa hoặc sóng biển đồng thời.
3. Trong cài đặt, đặt thời lượng tập trung thành 1 phút và bắt đầu. Có thể tải lại trang trong lúc đếm.
4. Sau khi hết giờ, kiểm tra thống kê tăng đúng 1 phút. Tải lại trang lần nữa để kiểm tra không ghi trùng.
5. Thêm, sửa hoặc đánh dấu một việc. Trên điện thoại, mở **Việc & thống kê** ở cạnh dưới.

Nhạc và tiếng nền được tổng hợp bằng Web Audio. Tùy chọn và đồng hồ dùng LocalStorage. Việc cần làm và lịch sử học dùng IndexedDB, theo địa chỉ trang trên từng trình duyệt. Việc lưu dữ liệu khi mở trực tiếp qua file có thể khác nhau giữa các trình duyệt, nên ưu tiên dùng địa chỉ localhost khi thử lưu trữ.

## Dùng nhạc từ URL

Bấm **Nhạc từ URL**, dán liên kết trực tiếp tới tệp âm thanh rồi bấm **Phát**. Trình phát hỗ trợ tua nếu tệp và máy chủ cho phép. Bạn có thể giữ âm nền mưa hoặc sóng biển trong lúc nghe. Nguồn nhạc cần cho phép trình duyệt truy cập tệp. Các trang xem video, playlist và liên kết chia sẻ cần mở được tệp âm thanh trực tiếp mới sử dụng được. Trên website chạy HTTPS, dùng URL âm thanh HTTPS.
