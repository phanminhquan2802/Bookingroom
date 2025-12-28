-- ============================================================
-- Migration: Thêm tiện nghi cho các loại phòng
-- Ngày tạo: 2025-01-XX
-- ============================================================
-- 
-- File này sẽ gán các tiện nghi cho từng loại phòng
-- Dựa trên ảnh mẫu: Studio Có Sân Hiên có đầy đủ tiện nghi
--
-- LƯU Ý: Cần có dữ liệu RoomTypes và Amenities trước
--
-- ============================================================

-- Hàm helper để lấy ID (giả sử RoomTypes và Amenities đã có dữ liệu)
-- Studio Có Sân Hiên (RoomTypeID = 1) - Đầy đủ tiện nghi như trong ảnh
INSERT INTO RoomAmenities (RoomTypeID, AmenityID) 
SELECT 1, AmenityID FROM Amenities 
WHERE AmenityName IN (
    'Studio nguyên căn',
    'Điều hòa không khí',
    'WiFi miễn phí',
    'Ban công',
    'Sân hiên',
    'Nhìn ra địa danh nổi tiếng',
    'Máy giặt',
    'TV màn hình phẳng',
    'Bếp',
    'Minibar',
    'Đồ bếp',
    'Phòng tắm riêng',
    'Bồn tắm hoặc Vòi sen',
    'Đồ vệ sinh',
    'Khăn tắm',
    'Máy sấy tóc',
    'Két an toàn',
    'Bàn làm việc'
)
ON DUPLICATE KEY UPDATE RoomTypeID = RoomTypeID;

-- Phòng Deluxe (RoomTypeID = 2)
INSERT INTO RoomAmenities (RoomTypeID, AmenityID) 
SELECT 2, AmenityID FROM Amenities 
WHERE AmenityName IN (
    'Điều hòa không khí',
    'WiFi miễn phí',
    'TV màn hình phẳng',
    'Phòng tắm riêng',
    'Bồn tắm hoặc Vòi sen',
    'Minibar',
    'Ban công',
    'Két an toàn',
    'Máy sấy tóc',
    'Bàn làm việc',
    'Dịch vụ dọn phòng'
)
ON DUPLICATE KEY UPDATE RoomTypeID = RoomTypeID;

-- Phòng Executive Suite (RoomTypeID = 3)
INSERT INTO RoomAmenities (RoomTypeID, AmenityID) 
SELECT 3, AmenityID FROM Amenities 
WHERE AmenityName IN (
    'Điều hòa không khí',
    'WiFi miễn phí',
    'TV màn hình phẳng',
    'Phòng tắm riêng',
    'Bồn tắm hoặc Vòi sen',
    'Minibar',
    'Ban công',
    'Két an toàn',
    'Máy sấy tóc',
    'Bàn làm việc',
    'Dịch vụ dọn phòng',
    'Nhìn ra thành phố',
    'Không hút thuốc'
)
ON DUPLICATE KEY UPDATE RoomTypeID = RoomTypeID;

-- Phòng Superior View River (RoomTypeID = 4)
INSERT INTO RoomAmenities (RoomTypeID, AmenityID) 
SELECT 4, AmenityID FROM Amenities 
WHERE AmenityName IN (
    'Điều hòa không khí',
    'WiFi miễn phí',
    'TV màn hình phẳng',
    'Phòng tắm riêng',
    'Bồn tắm hoặc Vòi sen',
    'Ban công',
    'Nhìn ra địa danh nổi tiếng',
    'Máy sấy tóc',
    'Két an toàn',
    'Bàn làm việc'
)
ON DUPLICATE KEY UPDATE RoomTypeID = RoomTypeID;

-- Phòng Standard (RoomTypeID = 5)
INSERT INTO RoomAmenities (RoomTypeID, AmenityID) 
SELECT 5, AmenityID FROM Amenities 
WHERE AmenityName IN (
    'Điều hòa không khí',
    'WiFi miễn phí',
    'TV màn hình phẳng',
    'Phòng tắm riêng',
    'Vòi sen',
    'Máy sấy tóc'
)
ON DUPLICATE KEY UPDATE RoomTypeID = RoomTypeID;

-- Thêm tiện nghi cho các phòng còn lại (tự động cho tất cả RoomTypes)
-- Có thể chạy query này để thêm tiện nghi cơ bản cho tất cả phòng
INSERT INTO RoomAmenities (RoomTypeID, AmenityID)
SELECT RT.RoomTypeID, A.AmenityID
FROM RoomTypes RT
CROSS JOIN Amenities A
WHERE A.AmenityName IN (
    'WiFi miễn phí',
    'Điều hòa không khí',
    'TV màn hình phẳng',
    'Phòng tắm riêng',
    'Bồn tắm hoặc Vòi sen',
    'Máy sấy tóc'
)
AND RT.IsDeleted = 0
AND A.IsDeleted = 0
ON DUPLICATE KEY UPDATE RoomTypeID = RoomTypeID;

-- ============================================================
-- KIỂM TRA
-- ============================================================
-- SELECT RT.RoomTypeName, A.AmenityName, A.Category
-- FROM RoomAmenities RA
-- JOIN RoomTypes RT ON RA.RoomTypeID = RT.RoomTypeID
-- JOIN Amenities A ON RA.AmenityID = A.AmenityID
-- WHERE RT.RoomTypeID = 1
-- ORDER BY A.Category, A.AmenityName;
--
-- SELECT RT.RoomTypeName, COUNT(RA.AmenityID) as SoTienNghi
-- FROM RoomTypes RT
-- LEFT JOIN RoomAmenities RA ON RT.RoomTypeID = RA.RoomTypeID
-- WHERE RT.IsDeleted = 0
-- GROUP BY RT.RoomTypeID, RT.RoomTypeName
-- ORDER BY RT.RoomTypeID;
--
-- ============================================================

