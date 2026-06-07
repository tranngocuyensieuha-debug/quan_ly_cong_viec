# Bảng điều hành tổ Thuế

Web bảng điều hành công việc nội bộ đơn giản cho tổ/phòng ban ngành Thuế. Ứng dụng không có đăng nhập, không cần backend, dữ liệu được lưu bằng `localStorage`.

## Công nghệ

- ReactJS
- TypeScript
- TailwindCSS
- Recharts
- Vite
- localStorage

## Chức năng

- Bảng điều hành hiển thị ngay khi vào web.
- 4 cột trạng thái: Sẽ làm, Đang làm, Chờ xác nhận, Hoàn thành.
- Tạo, sửa, xóa, đổi trạng thái công việc.
- Giao việc cho một người, chọn tổ phụ trách, deadline và mức độ ưu tiên.
- Cảnh báo deadline: quá hạn màu đỏ, còn hạn trong 3 ngày màu vàng.
- Biểu đồ theo trạng thái, theo người được giao và theo tổ nghiệp vụ.
- Dữ liệu mẫu gồm 6 thành viên và 42 công việc của Tổ quản lý hỗ trợ cá nhân hộ kinh doanh số 1.

## Chạy project

```bash
npm install
npm run dev
```

Sau đó mở URL Vite hiển thị trong terminal, thường là:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

## Ghi chú

Đây là bản demo chạy cục bộ. Dữ liệu nằm trong trình duyệt của từng máy và không đồng bộ giữa nhiều người dùng.
