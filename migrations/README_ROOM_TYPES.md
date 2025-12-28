# 📋 HƯỚNG DẪN TẠO DATABASE CHO ROOM TYPES

## Tổng quan

Cấu trúc database mới cho các loại phòng trong hotels/villas/stayhomes:
- **RoomTypes**: Bảng lưu các loại phòng trong mỗi hotel (VD: Studio Có Sân Hiên, Deluxe, Suite)
- **Amenities**: Bảng lưu danh sách tiện nghi (WiFi, Điều hòa, Máy giặt, TV, Bếp, etc.)
- **RoomAmenities**: Bảng liên kết phòng với tiện nghi

## Cấu trúc phân cấp

```
Rooms (Hotels/Villas/Stayhomes)
    ├── Grand Hotel Saigon
    │   ├── Studio Có Sân Hiên (RoomType)
    │   │   ├── WiFi miễn phí (Amenity)
    │   │   ├── Điều hòa không khí (Amenity)
    │   │   ├── Máy giặt (Amenity)
    │   │   └── ...
    │   ├── Phòng Deluxe (RoomType)
    │   └── Phòng Executive Suite (RoomType)
    └── ...
```

## Cách chạy migration

### Bước 1: Tạo bảng RoomTypes

Chạy file: **`04_create_room_types_table.sql`**

```sql
-- Tạo bảng RoomTypes với các trường:
-- RoomTypeID, HotelID, RoomTypeName, Description, Price, Area
-- MaxGuests, BedType, BedCount, ImageURL, IsDeleted
```

### Bước 2: Tạo bảng Amenities

Chạy file: **`05_create_amenities_table.sql`**

```sql
-- Tạo bảng Amenities và thêm ~30 tiện nghi phổ biến
-- WiFi, Điều hòa, Máy giặt, TV, Bếp, Ban công, etc.
```

### Bước 3: Tạo bảng RoomAmenities

Chạy file: **`06_create_room_amenities_table.sql`**

```sql
-- Tạo bảng liên kết RoomTypes với Amenities
```

### Bước 4: Thêm dữ liệu RoomTypes

Chạy file: **`07_insert_room_types_sample.sql`**

Thêm ~25 loại phòng cho các hotels:
- Studio, Deluxe, Suite, Villa, etc.
- Mỗi hotel có 2-3 loại phòng

### Bước 5: Gán tiện nghi cho phòng

Chạy file: **`08_insert_room_amenities_sample.sql`**

Gán tiện nghi cho từng loại phòng:
- Studio Có Sân Hiên: Đầy đủ tiện nghi (18 tiện nghi)
- Các phòng khác: Tiện nghi cơ bản + đặc biệt

## Kiểm tra sau khi chạy

### 1. Kiểm tra RoomTypes

```sql
SELECT RT.*, R.RoomName as HotelName 
FROM RoomTypes RT
JOIN Rooms R ON RT.HotelID = R.RoomID
WHERE RT.IsDeleted = 0
LIMIT 10;
```

Kết quả mong đợi: ~25 loại phòng

### 2. Kiểm tra Amenities

```sql
SELECT * FROM Amenities WHERE IsDeleted = 0;
```

Kết quả mong đợi: ~30 tiện nghi

### 3. Kiểm tra RoomAmenities

```sql
SELECT RT.RoomTypeName, A.AmenityName, A.Category
FROM RoomAmenities RA
JOIN RoomTypes RT ON RA.RoomTypeID = RT.RoomTypeID
JOIN Amenities A ON RA.AmenityID = A.AmenityID
WHERE RT.RoomTypeID = 1
ORDER BY A.Category, A.AmenityName;
```

Kết quả mong đợi: Studio Có Sân Hiên có ~18 tiện nghi

### 4. Kiểm tra số lượng phòng theo hotel

```sql
SELECT 
    R.RoomName as HotelName,
    COUNT(RT.RoomTypeID) as SoLoaiPhong,
    MIN(RT.Price) as GiaThapNhat,
    MAX(RT.Price) as GiaCaoNhat
FROM Rooms R
LEFT JOIN RoomTypes RT ON R.RoomID = RT.HotelID AND RT.IsDeleted = 0
WHERE R.IsDeleted = 0
GROUP BY R.RoomID, R.RoomName
ORDER BY R.RoomID;
```

## Schema đầy đủ

### Bảng RoomTypes

```sql
CREATE TABLE RoomTypes (
    RoomTypeID INT AUTO_INCREMENT PRIMARY KEY,
    HotelID INT NOT NULL,                    -- Thuộc hotel nào (tham chiếu Rooms.RoomID)
    RoomTypeName VARCHAR(100) NOT NULL,     -- Tên loại phòng
    Description TEXT,                         -- Mô tả
    Price DECIMAL(10, 0) NOT NULL,           -- Giá mỗi đêm
    Area DECIMAL(6, 2),                     -- Diện tích (m²)
    MaxGuests INT DEFAULT 2,               -- Số khách tối đa
    BedType VARCHAR(100),                   -- Loại giường
    BedCount INT DEFAULT 1,                 -- Số lượng giường
    ImageURL VARCHAR(500),                  -- Ảnh phòng
    IsDeleted TINYINT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (HotelID) REFERENCES Rooms(RoomID) ON DELETE CASCADE
);
```

### Bảng Amenities

```sql
CREATE TABLE Amenities (
    AmenityID INT AUTO_INCREMENT PRIMARY KEY,
    AmenityName VARCHAR(100) NOT NULL UNIQUE,
    IconClass VARCHAR(50),                  -- Class icon
    Category VARCHAR(50),                   -- Nhóm tiện nghi
    IsDeleted TINYINT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng RoomAmenities

```sql
CREATE TABLE RoomAmenities (
    RoomAmenityID INT AUTO_INCREMENT PRIMARY KEY,
    RoomTypeID INT NOT NULL,
    AmenityID INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (RoomTypeID) REFERENCES RoomTypes(RoomTypeID) ON DELETE CASCADE,
    FOREIGN KEY (AmenityID) REFERENCES Amenities(AmenityID) ON DELETE CASCADE,
    UNIQUE KEY unique_room_amenity (RoomTypeID, AmenityID)
);
```

## Dữ liệu mẫu

### RoomTypes (~25 loại phòng):
- Studio Có Sân Hiên (30 m², 2 khách, 1 giường đôi lớn)
- Phòng Deluxe (30-35 m², 2 khách)
- Phòng Executive Suite (50 m², 3 khách)
- Bungalow View Biển (40 m², 2 khách)
- Villa 2-4 Phòng Ngủ (120-250 m², 4-8 khách)
- ...

### Amenities (~30 tiện nghi):
- **Basic**: WiFi, Điều hòa, TV, Máy sấy tóc
- **Bathroom**: Phòng tắm riêng, Bồn tắm, Đồ vệ sinh
- **Kitchen**: Bếp, Đồ bếp, Tủ lạnh, Minibar
- **Space**: Ban công, Sân hiên, Studio nguyên căn
- **Laundry**: Máy giặt, Dịch vụ giặt ủi
- **Security**: Két an toàn, Khóa cửa điện tử
- ...

## Lưu ý quan trọng

1. **HotelID trong RoomTypes**: Tham chiếu đến `Rooms.RoomID` (vì Rooms = Hotels)
2. **Thứ tự chạy migration**: Phải chạy theo thứ tự 04 → 05 → 06 → 07 → 08
3. **Dữ liệu Hotels**: Cần có dữ liệu hotels trong bảng Rooms trước (từ file 03)
4. **ON DUPLICATE KEY**: Sử dụng để tránh lỗi khi chạy lại

## Cập nhật Code (nếu cần)

Sau khi chạy migration, có thể cần cập nhật:

1. **roomController.js**: 
   - Thêm API lấy RoomTypes theo HotelID
   - Thêm API lấy Amenities theo RoomTypeID

2. **Frontend**:
   - Hiển thị danh sách RoomTypes khi xem chi tiết hotel
   - Hiển thị tiện nghi cho từng loại phòng
   - Filter theo tiện nghi

## Xử lý lỗi

- "Table doesn't exist" → Chạy các file migration theo thứ tự
- "Foreign key constraint fails" → Đảm bảo có dữ liệu Hotels trong Rooms
- "Duplicate entry" → Sử dụng ON DUPLICATE KEY UPDATE hoặc IGNORE

