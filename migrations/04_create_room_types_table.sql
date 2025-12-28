-- ============================================================
-- Migration: Tạo bảng RoomTypes (Các loại phòng trong Hotels/Villas)
-- Ngày tạo: 2025-01-XX
-- ============================================================
-- 
-- Bảng này lưu các loại phòng có trong mỗi hotel/villa/stayhome
-- Ví dụ: Studio Có Sân Hiên, Deluxe Room, Suite, etc.
--
-- ============================================================

-- Tạo bảng RoomTypes
CREATE TABLE IF NOT EXISTS `RoomTypes` (
    `RoomTypeID` INT AUTO_INCREMENT PRIMARY KEY,
    `HotelID` INT NOT NULL,                    -- Thuộc hotel/villa nào (tham chiếu Rooms.RoomID)
    `RoomTypeName` VARCHAR(100) NOT NULL,      -- Tên loại phòng (VD: Studio Có Sân Hiên)
    `Description` TEXT,                         -- Mô tả chi tiết
    `Price` DECIMAL(10, 0) NOT NULL,           -- Giá mỗi đêm (VNĐ)
    `Area` DECIMAL(6, 2),                      -- Diện tích (m²)
    `MaxGuests` INT DEFAULT 2,                 -- Số khách tối đa
    `BedType` VARCHAR(100),                    -- Loại giường (VD: 1 giường đôi lớn, 2 giường đơn)
    `BedCount` INT DEFAULT 1,                  -- Số lượng giường
    `ImageURL` VARCHAR(500),                   -- Ảnh phòng
    `IsDeleted` TINYINT DEFAULT 0,            -- Soft delete
    `CreatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`HotelID`) REFERENCES `Rooms`(`RoomID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- KIỂM TRA
-- ============================================================
-- DESCRIBE RoomTypes;
-- SELECT * FROM RoomTypes LIMIT 5;
--
-- ============================================================

