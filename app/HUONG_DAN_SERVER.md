# Hướng dẫn chạy trên server Linux

## Mục tiêu

- Lần đầu: SSH vào server và chạy `install.sh`.
- Web chạy ngoài bằng port `80`, nên truy cập được bằng `http://IP_SERVER` hoặc domain, không cần `:5173`.
- Các lần sau: chỉ cần build lại, kéo đè file trong thư mục `dist` lên server bằng FileZilla.
- Server không cần NodeJS, không cần `npm install`, không cần database.

## Lần đầu cài đặt

Trên FileZilla, tạo thư mục riêng, ví dụ:

```text
/home/ec2-user/quan-ly-cong-viec
```

Kéo toàn bộ nội dung thư mục `dist` lên thư mục đó.

SSH vào server rồi chạy:

```bash
cd /home/ec2-user/quan-ly-cong-viec
sh install.sh
```

Script sẽ:

- Kiểm tra và tự cài `python3` nếu thiếu.
- Kiểm tra và tự cài `nginx` nếu thiếu.
- Tạo service `tax-task-web` để app chạy nền ở `127.0.0.1:5173`.
- Cấu hình Nginx chuyển port `80` vào app.
- Tự khởi động lại service và Nginx.

Sau khi chạy xong, truy cập:

```text
http://<IP_SERVER>
```

Khi đã trỏ domain về IP server, truy cập:

```text
http://ten-mien-cua-ban
```

Lưu ý: trên AWS/EC2 cần mở Security Group cho port `80`.

## Các lần cập nhật sau

Trên máy của bạn, build lại:

```bash
npm run build
```

Sau đó dùng FileZilla kéo đè toàn bộ nội dung thư mục `dist` mới vào đúng thư mục cũ trên server:

```text
/home/ec2-user/quan-ly-cong-viec
```

Nếu chỉ thay giao diện hoặc code frontend, không cần SSH lại. Tải lại trình duyệt là web dùng file mới.

Nếu thay `server.py`, `install.sh`, hoặc logic đọc Excel phía server, chạy thêm:

```bash
sudo systemctl restart tax-task-web
```

## Lệnh quản lý service

```bash
sudo systemctl status tax-task-web
sudo systemctl restart tax-task-web
sudo systemctl stop tax-task-web
sudo systemctl restart nginx
```

## Chạy thủ công nếu server không có systemd

Nếu server không hỗ trợ `systemd`, không dùng được service tự chạy nền. Khi đó chạy thủ công:

```bash
cd /home/ec2-user/quan-ly-cong-viec
sh start.sh
```

Trường hợp này sẽ truy cập bằng:

```text
http://<IP_SERVER>:5173
```

## File dữ liệu Excel

Web đọc dữ liệu từ:

```text
file du lieu.xlsx
```

File này đặt cùng thư mục với `server.py`. Khi cần cập nhật dữ liệu, kéo đè file Excel mới cùng tên lên server rồi bấm nút cập nhật trên web.

Nếu muốn chỉ định file Excel ở vị trí khác:

```bash
EXCEL_FILE="/duong-dan/file du lieu.xlsx" sh install.sh
```
