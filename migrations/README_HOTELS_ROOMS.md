# 📋 HƯỚNG DẪN TẠO DATABASE CHO HOTELS VÀ ROOMS

## Tổng quan

Cấu trúc database mới bao gồm:
- **Hotels**: Bảng lưu thông tin các khách sạn, hotel, villa
- **Rooms**: Bảng phòng (đã có, được cập nhật thêm HotelID)
- **Categories**: Bảng danh mục (Khách sạn, Villa)

## Cấu trúc phân cấp

```
Categories (Loại chỗ ở)
    ├── Khách sạn
    └── Villa

Hotels (Khách sạn/Hotel/Villa)
    ├── Grand Hotel Saigon
    ├── Riverside Hotel
    ├── Hanoi Grand Plaza
    └── ...

Rooms (Phòng trong từng Hotel)
    ├── Phòng Deluxe (thuộc Grand Hotel Saigon)
    ├── Phòng Executive Suite (thuộc Grand Hotel Saigon)
    └── ...
```

## Cách chạy migration

### Bước 1: Tạo bảng Hotels

Chạy file: **`01_create_hotels_table.sql`**

```sql
-- Tạo bảng Hotels với các trường:
-- HotelID, HotelName, CategoryID, Address, Description, ImageURL
-- Latitude, Longitude, Phone, Email, StarRating, IsDeleted
```

### Bước 2: Thêm HotelID vào Rooms

Chạy file: **`02_add_hotelid_to_rooms.sql`**

```sql
-- Thêm cột HotelID vào bảng Rooms
-- Thêm Foreign Key liên kết Rooms với Hotels
```

**Lưu ý:** 
- Nếu cột đã tồn tại → Bỏ qua lỗi "Duplicate column name"
- Nếu foreign key đã tồn tại → Bỏ qua lỗi "Duplicate foreign key"

### Bước 3: Thêm dữ liệu Hotels mẫu

Chạy file: **`03_insert_sample_hotels.sql`**

Thêm 10 hotels:
- 8 Khách sạn (CategoryID = 1)
- 2 Villa (CategoryID = 2)

### Bước 4: Thêm phòng cho các Hotels

Chạy file: **`04_insert_rooms_for_hotels.sql`**

Thêm khoảng 25 phòng cho các hotels:
- Mỗi hotel có 2-4 phòng
- Các loại phòng: Standard, Superior, Deluxe, Suite, Villa

## Kiểm tra sau khi chạy

### 1. Kiểm tra bảng Hotels

```sql
SELECT * FROM Hotels WHERE IsDeleted = 0;
```

Kết quả mong đợi: 10 hotels

### 2. Kiểm tra Rooms có HotelID

```sql
SELECT RoomID, RoomName, HotelID, CategoryID, Price 
FROM Rooms 
WHERE IsDeleted = 0 
LIMIT 10;
```

Kết quả mong đợi: Các phòng có HotelID được gán

### 3. Kiểm tra quan hệ Hotels - Rooms

```sql
SELECT 
    H.HotelID, 
    H.HotelName, 
    C.CategoryName,
    COUNT(R.RoomID) as SoPhong,
    MIN(R.Price) as GiaThapNhat,
    MAX(R.Price) as GiaCaoNhat
FROM Hotels H
LEFT JOIN Categories C ON H.CategoryID = C.CategoryID
LEFT JOIN Rooms R ON H.HotelID = R.HotelID AND R.IsDeleted = 0
WHERE H.IsDeleted = 0
GROUP BY H.HotelID, H.HotelName, C.CategoryName
ORDER BY H.HotelID;
```

Kết quả mong đợi: Mỗi hotel có 2-4 phòng

### 4. Kiểm tra Rooms theo Hotel

```sql
SELECT 
    R.RoomID, 
    R.RoomName, 
    H.HotelName,
    C.CategoryName as LoaiChoO,
    R.Price,
    R.Status
FROM Rooms R
LEFT JOIN Hotels H ON R.HotelID = H.HotelID
LEFT JOIN Categories C ON H.CategoryID = C.CategoryID
WHERE R.IsDeleted = 0
ORDER BY H.HotelID, R.RoomID;
```

## Schema đầy đủ

### Bảng Hotels

```sql
CREATE TABLE Hotels (
    HotelID INT AUTO_INCREMENT PRIMARY KEY,
    HotelName VARCHAR(100) NOT NULL,
    CategoryID INT,                    -- Loại: Khách sạn, Villa
    Address VARCHAR(255),              -- Địa chỉ
    Description TEXT,                  -- Mô tả
    ImageURL VARCHAR(500),             -- Ảnh đại diện
    Latitude DECIMAL(10, 8),           -- Vĩ độ
    Longitude DECIMAL(11, 8),         -- Kinh độ
    Phone VARCHAR(20),                 -- Số điện thoại
    Email VARCHAR(100),               -- Email
    StarRating INT DEFAULT 3,         -- Hạng sao (1-5)
    IsDeleted TINYINT DEFAULT 0,     -- Soft delete
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE SET NULL
);
```

### Bảng Rooms (đã cập nhật)

```sql
CREATE TABLE Rooms (
    RoomID INT AUTO_INCREMENT PRIMARY KEY,
    RoomName VARCHAR(100) NOT NULL,
    HotelID INT,                       -- ✅ MỚI: Thuộc hotel nào
    CategoryID INT,                    -- Loại phòng (có thể khác với CategoryID của Hotel)
    Price DECIMAL(10, 0) NOT NULL,
    Status ENUM('available', 'maintenance') DEFAULT 'available',
    Description TEXT,
    ImageURL VARCHAR(500),
    Address VARCHAR(255),
    IsDeleted TINYINT DEFAULT 0,
    Latitude DECIMAL(10, 8),
    Longitude DECIMAL(11, 8),
    FOREIGN KEY (HotelID) REFERENCES Hotels(HotelID) ON DELETE SET NULL,
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE SET NULL
);
```

## Dữ liệu mẫu

### 10 Hotels được tạo:

1. **Grand Hotel Saigon** (TP. HCM) - 5 sao - 3 phòng
2. **Riverside Hotel** (TP. HCM) - 4 sao - 2 phòng
3. **Hanoi Grand Plaza** (Hà Nội) - 5 sao - 3 phòng
4. **Old Quarter Hotel** (Hà Nội) - 3 sao - 2 phòng
5. **Danang Beach Resort** (Đà Nẵng) - 5 sao - 3 phòng
6. **My Khe Hotel** (Đà Nẵng) - 4 sao - 2 phòng
7. **Villa Paradise Phú Quốc** (Phú Quốc) - Villa - 3 phòng
8. **Villa Sunset Đà Lạt** (Đà Lạt) - Villa - 2 phòng
9. **Nha Trang Bay Hotel** (Nha Trang) - 4 sao - 3 phòng
10. **Imperial Hotel Huế** (Huế) - 4 sao - 2 phòng

**Tổng cộng:** ~25 phòng

## Cập nhật Code (nếu cần)

Sau khi chạy migration, có thể cần cập nhật:

1. **roomController.js**: Thêm filter theo HotelID khi tìm kiếm
2. **Frontend**: Hiển thị tên hotel trong danh sách phòng
3. **room-detail.html**: Hiển thị thông tin hotel chứa phòng

## Lưu ý quan trọng

1. **Thứ tự chạy migration:**
   - 01_create_hotels_table.sql
   - 02_add_hotelid_to_rooms.sql
   - 03_insert_sample_hotels.sql
   - 04_insert_rooms_for_hotels.sql

2. **Nếu Rooms đã có dữ liệu:**
   - Các phòng cũ sẽ có HotelID = NULL
   - Có thể cập nhật sau bằng cách gán HotelID cho các phòng cũ

3. **Xử lý lỗi:**
   - "Duplicate column name" → Bỏ qua (cột đã tồn tại)
   - "Duplicate foreign key" → Bỏ qua (constraint đã tồn tại)
   - "Table doesn't exist" → Chạy Database-query.txt trước

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
- File `Database-query.txt` - Schema cơ bản
- Kiểm tra foreign keys: `SHOW CREATE TABLE Rooms;`
- Kiểm tra dữ liệu: `SELECT COUNT(*) FROM Hotels;`

