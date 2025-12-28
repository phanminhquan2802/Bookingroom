# 📋 HƯỚNG DẪN DATABASE - ROOMS LÀ HOTELS

## Tổng quan

**QUAN TRỌNG:** Trong hệ thống này, bảng `Rooms` đóng vai trò như `Hotels`.
- Mỗi record trong `Rooms` = 1 khách sạn/hotel/villa
- Không có bảng `Hotels` riêng
- `CategoryID` trong `Rooms` xác định loại: Khách sạn hoặc Villa

## Cấu trúc

```
Categories (Loại chỗ ở)
    ├── Khách sạn (CategoryID = 1)
    └── Villa (CategoryID = 2)

Rooms (Mỗi record = 1 Hotel/Villa)
    ├── Grand Hotel Saigon (CategoryID = 1)
    ├── Riverside Hotel (CategoryID = 1)
    ├── Villa Paradise Phú Quốc (CategoryID = 2)
    └── ...
```

## Cách chạy migration

### Bước 1: Thêm Categories

Chạy file: **`01_insert_categories.sql`**

```sql
-- Tạo bảng Categories (nếu chưa có)
-- Thêm 2 categories: Khách sạn, Villa
```

### Bước 2: Cập nhật bảng Rooms

Chạy file: **`02_update_rooms_schema.sql`**

```sql
-- Thêm các cột: CategoryID, Address, IsDeleted, Latitude, Longitude
-- Thêm Foreign Key cho CategoryID
```

**Lưu ý:** 
- Nếu cột đã tồn tại → Bỏ qua lỗi "Duplicate column name"
- Nếu foreign key đã tồn tại → Bỏ qua lỗi "Duplicate foreign key"

### Bước 3: Thêm Hotels vào Rooms

Chạy file: **`03_insert_hotels_as_rooms.sql`**

Thêm 20 hotels/khách sạn/villa:
- 16 Khách sạn (CategoryID = 1)
- 4 Villa (CategoryID = 2)

## Kiểm tra sau khi chạy

### 1. Kiểm tra Categories

```sql
SELECT * FROM Categories WHERE IsDeleted = 0;
```

Kết quả mong đợi: 2 categories (Khách sạn, Villa)

### 2. Kiểm tra Rooms (Hotels)

```sql
SELECT 
    RoomID, 
    RoomName, 
    CategoryID, 
    Address, 
    Price, 
    Status 
FROM Rooms 
WHERE IsDeleted = 0 
LIMIT 10;
```

Kết quả mong đợi: Các hotels có đầy đủ thông tin

### 3. Kiểm tra theo Category

```sql
SELECT 
    C.CategoryName,
    COUNT(*) as SoLuong,
    AVG(R.Price) as GiaTrungBinh,
    MIN(R.Price) as GiaThapNhat,
    MAX(R.Price) as GiaCaoNhat
FROM Rooms R
LEFT JOIN Categories C ON R.CategoryID = C.CategoryID
WHERE R.IsDeleted = 0
GROUP BY C.CategoryName;
```

Kết quả mong đợi:
- Khách sạn: ~16 hotels
- Villa: ~4 villas

### 4. Kiểm tra địa điểm

```sql
SELECT 
    RoomName,
    Address,
    Latitude,
    Longitude
FROM Rooms
WHERE IsDeleted = 0
AND Address IS NOT NULL
LIMIT 10;
```

## Schema bảng Rooms (đóng vai trò Hotels)

```sql
CREATE TABLE Rooms (
    RoomID INT AUTO_INCREMENT PRIMARY KEY,
    RoomName VARCHAR(100) NOT NULL,        -- Tên hotel/villa
    CategoryID INT,                        -- Loại: Khách sạn (1) hoặc Villa (2)
    Price DECIMAL(10, 0) NOT NULL,         -- Giá mỗi đêm
    Status ENUM('available', 'maintenance') DEFAULT 'available',
    Description TEXT,                       -- Mô tả hotel/villa
    ImageURL VARCHAR(500),                 -- Ảnh đại diện
    Address VARCHAR(255),                  -- Địa chỉ
    IsDeleted TINYINT DEFAULT 0,          -- Soft delete
    Latitude DECIMAL(10, 8),              -- Vĩ độ
    Longitude DECIMAL(11, 8),            -- Kinh độ
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE SET NULL
);
```

## Dữ liệu mẫu (20 Hotels/Villas)

### Khách sạn (16 hotels):
- TP. Hồ Chí Minh: 3 hotels
- Hà Nội: 3 hotels
- Đà Nẵng: 3 hotels
- Nha Trang: 2 hotels
- Huế: 2 hotels
- Đà Lạt: 2 hotels
- Vũng Tàu: 1 hotel

### Villa (4 villas):
- Phú Quốc: 1 villa
- Đà Lạt: 1 villa
- Nha Trang: 1 villa
- Hà Nội: 1 villa

## Lưu ý quan trọng

1. **Rooms = Hotels**: Mỗi record trong `Rooms` là một hotel/villa độc lập
2. **CategoryID**: Phân biệt loại chỗ ở (Khách sạn hoặc Villa)
3. **Không có HotelID**: Không cần bảng Hotels riêng
4. **Booking**: Khách đặt trực tiếp vào `Rooms` (mỗi room = 1 hotel)

## Cập nhật Code (nếu cần)

Code hiện tại đã phù hợp vì:
- `roomController.js` đã query từ bảng `Rooms`
- Frontend hiển thị `Rooms` như hotels
- Không cần thay đổi gì

## Xử lý lỗi

- "Duplicate column name" → Bỏ qua (cột đã tồn tại)
- "Duplicate foreign key" → Bỏ qua (constraint đã tồn tại)
- "Table doesn't exist" → Chạy `Database-query.txt` trước

