# Ke hoach xay dung web "Quan ly cong viec to Thue"

## 1. Muc tieu

Xay dung mot web quan ly cong viec noi bo don gian cho mot to/phong ban nganh Thue, phuc vu demo va dung thu cho khoang 6-10 nguoi.

He thong khong can dang nhap, khong can backend, khong can database. Khi mo website, nguoi dung thay ngay Dashboard quan ly cong viec.

## 2. Pham vi chuc nang

### 2.1. Man hinh chinh

- Vao web la thay Dashboard.
- Dashboard hien thi 4 cot trang thai:
  - Se lam
  - Dang lam
  - Cho xac nhan
  - Hoan thanh
- Moi cong viec hien thi du thong tin quan trong:
  - Ten cong viec
  - To phu trach
  - Nguoi duoc giao
  - Deadline
  - Muc do uu tien
  - Canh bao deadline

### 2.2. Quan ly cong viec

- Tao cong viec moi.
- Sua cong viec.
- Xoa cong viec.
- Doi trang thai cong viec.
- Giao viec cho mot nguoi.
- Chon to phu trach.
- Chon deadline.
- Chon muc do uu tien.

### 2.3. Bieu do thong ke

Su dung Recharts de hien thi:

- So luong cong viec theo trang thai.
- So luong cong viec theo tung nguoi.
- So luong cong viec theo tung to nghiep vu.

### 2.4. Canh bao deadline

- Qua han: hien thi mau do.
- Con han trong 3 ngay: hien thi mau vang.
- Con xa han: hien thi mau binh thuong.

## 3. Du lieu mau

### 3.1. Nhan su mau

Can tao san 8 nguoi:

- 1 to truong
- 1 to pho
- 6 cong chuc

Thong tin toi thieu cua moi nguoi:

- Ma dinh danh
- Ho ten
- Chuc vu
- To nghiep vu

### 3.2. To nghiep vu mau

Danh sach to/nghiep vu:

- To Ke khai - Ke toan thue
- To Quan ly ho kinh doanh
- To Quan ly doanh nghiep
- To Kiem tra thue
- To Quan ly no
- To Tuyen truyen - Ho tro nguoi nop thue
- To Cong nghe thong tin
- Van phong

### 3.3. Cong viec mau

Can tao san 25 cong viec phu hop boi canh nganh Thue, gom cac nhom viec:

- Tiep nhan chi dao.
- Giao nhiem vu cho cong chuc.
- Theo doi tien do xu ly ho so.
- Ra soat du lieu.
- Bao cao dinh ky.
- Kiem tra ho kinh doanh/doanh nghiep.
- Tuyen truyen, ho tro nguoi nop thue.
- Xu ly viec phat sinh.

Vi du cong viec:

- Ra soat danh sach ho kinh doanh ngung nghi.
- Tong hop bao cao thue thang.
- Kiem tra ho so khai thue GTGT.
- Don doc no thue qua han.
- Ho tro nguoi nop thue cai dat eTax Mobile.
- Ra soat du lieu ma so thue ca nhan.
- Chuan bi bao cao giao ban tuan.
- Cap nhat danh sach doanh nghiep moi thanh lap.
- Kiem tra tinh trang nop to khai.
- Tong hop vuong mac cua nguoi nop thue.
- Xu ly yeu cau ho tro hoa don dien tu.
- Kiem tra may tinh, may in, chu ky so noi bo.

## 4. Cong nghe su dung

- ReactJS
- TypeScript
- TailwindCSS
- Recharts
- Vite
- localStorage

Khong su dung:

- Backend
- Database
- Dang nhap
- Docker

## 5. Kien truc du kien

```text
src/
  components/
    Dashboard.tsx
    TaskBoard.tsx
    TaskColumn.tsx
    TaskCard.tsx
    TaskFormModal.tsx
    SummaryCards.tsx
    ChartsPanel.tsx
  data/
    seed.ts
  hooks/
    useTasks.ts
  types/
    index.ts
  utils/
    deadline.ts
    statistics.ts
    storage.ts
  App.tsx
  main.tsx
  index.css
```

### 5.1. `types/index.ts`

Khai bao cac kieu du lieu chinh:

- `User`
- `Team`
- `Task`
- `TaskStatus`
- `Priority`

### 5.2. `data/seed.ts`

Chua du lieu mau:

- Danh sach nhan su.
- Danh sach to nghiep vu.
- Danh sach 25 cong viec.

### 5.3. `utils/storage.ts`

Xu ly:

- Doc cong viec tu localStorage.
- Ghi cong viec vao localStorage.
- Neu localStorage chua co du lieu thi nap du lieu mau.

### 5.4. `utils/deadline.ts`

Tinh trang deadline:

- Qua han.
- Sap den han trong 3 ngay.
- Con xa han.

### 5.5. `utils/statistics.ts`

Tinh so lieu cho Dashboard va bieu do:

- Dem cong viec theo trang thai.
- Dem cong viec theo nguoi.
- Dem cong viec theo to nghiep vu.
- Dem cong viec qua han, sap den han, da hoan thanh.

### 5.6. `hooks/useTasks.ts`

Quan ly state cong viec:

- Nap du lieu ban dau.
- Them cong viec.
- Sua cong viec.
- Xoa cong viec.
- Doi trang thai.
- Dong bo localStorage.

## 6. Thiet ke giao dien

### 6.1. Phong cach

- Don gian, ro rang, de nhin.
- Mau chu dao: xanh duong, trang, xam.
- Phu hop demo noi bo trong co quan nha nuoc.
- Khong dung hieu ung phuc tap.

### 6.2. Bo cuc

Trang Dashboard gom:

- Header: ten he thong.
- Khu thong ke nhanh.
- Khu bieu do.
- Bang Kanban 4 cot.
- Nut tao cong viec moi.

### 6.3. The cong viec

Moi the cong viec hien thi:

- Ten cong viec.
- Noi dung ngan gon.
- To phu trach.
- Nguoi duoc giao.
- Deadline.
- Muc do uu tien.
- Nut sua.
- Nut xoa.
- Chon nhanh trang thai.

## 7. Luong du lieu

1. Nguoi dung mo web.
2. Ung dung kiem tra localStorage.
3. Neu chua co du lieu, nap du lieu mau.
4. Dashboard hien thi danh sach cong viec va bieu do.
5. Khi nguoi dung them/sua/xoa/doi trang thai, state React cap nhat.
6. Du lieu moi duoc ghi lai vao localStorage.
7. Lan sau mo web, du lieu cu duoc khoi phuc.

## 8. Ke hoach trien khai

### Buoc 1. Khoi tao project

- Tao project Vite React TypeScript.
- Cai dat TailwindCSS.
- Cai dat Recharts.
- Cau hinh script:
  - `npm install`
  - `npm run dev`

### Buoc 2. Dinh nghia du lieu

- Tao type cho nguoi dung, to nghiep vu, cong viec.
- Tao enum/union type cho trang thai va muc do uu tien.
- Tao du lieu mau dung boi canh nganh Thue.

### Buoc 3. Xay dung lop luu tru

- Viet ham doc du lieu tu localStorage.
- Viet ham ghi du lieu vao localStorage.
- Viet logic nap seed data khi chua co du lieu.

### Buoc 4. Xay dung logic cong viec

- Them cong viec.
- Sua cong viec.
- Xoa cong viec.
- Doi trang thai.
- Tinh canh bao deadline.
- Tinh thong ke.

### Buoc 5. Xay dung giao dien Dashboard

- Header.
- The thong ke nhanh.
- Bieu do.
- Kanban board 4 cot.
- Form tao/sua cong viec.

### Buoc 6. Hoan thien giao dien

- To mau uu tien.
- To mau deadline.
- Responsive co ban cho man hinh laptop va desktop.
- Dam bao chu ro, khoang cach gon, de thao tac.

### Buoc 7. Kiem thu

Kiem tra thu cong cac tinh huong:

- Mo web lan dau co du lieu mau.
- Tao cong viec moi.
- Sua cong viec.
- Xoa cong viec.
- Doi trang thai cong viec.
- Refresh trinh duyet van giu du lieu.
- Bieu do cap nhat dung sau khi thay doi cong viec.
- Deadline qua han hien mau do.
- Deadline trong 3 ngay hien mau vang.

### Buoc 8. Viet huong dan chay

Cap nhat README voi noi dung:

```bash
npm install
npm run dev
```

## 9. Tieu chi hoan thanh

- Web chay duoc bang `npm run dev`.
- Khong co man hinh dang nhap.
- Vao web thay ngay Dashboard.
- Co du lieu mau gom 8 nhan su va 25 cong viec.
- Co 4 cot trang thai.
- Tao/sua/xoa/doi trang thai cong viec hoat dong.
- Giao viec, chon to, deadline, muc uu tien hoat dong.
- Du lieu duoc luu bang localStorage.
- Co 3 bieu do theo yeu cau.
- Giao dien don gian, de nhin, dung tong xanh duong - trang - xam.

## 10. Rui ro va cach giam thieu

- localStorage chi phu hop demo, khong phu hop du lieu that nhieu nguoi dung.
  - Chap nhan vi yeu cau khong can backend/database.
- Nhieu nguoi dung tren nhieu may se khong dong bo du lieu.
  - Ghi ro day la ban demo noi bo chay cuc bo.
- Du lieu co the mat neu nguoi dung xoa localStorage.
  - Co the bo sung nut khoi phuc du lieu mau neu can.

## 11. Huong mo rong sau demo

Neu can phat trien tiep, co the bo sung:

- Dang nhap theo tai khoan noi bo.
- Phan quyen to truong, to pho, cong chuc.
- Backend va database.
- Lich su xu ly cong viec.
- Binh luan trong cong viec.
- File dinh kem.
- Loc/tim kiem nang cao.
- Xuat bao cao Excel.
