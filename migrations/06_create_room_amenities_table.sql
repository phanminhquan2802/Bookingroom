-- ============================================================
-- Migration: Tạo bảng RoomAmenities (Liên kết RoomTypes với Amenities)
-- Ngày tạo: 2025-01-XX
-- ============================================================
-- 
-- Bảng này liên kết các loại phòng với tiện nghi
-- Mỗi phòng có thể có nhiều tiện nghi
--
-- ============================================================

-- Tạo bảng RoomAmenities
CREATE TABLE IF NOT EXISTS `RoomAmenities` (
    `RoomAmenityID` INT AUTO_INCREMENT PRIMARY KEY,
    `RoomTypeID` INT NOT NULL,
    `AmenityID` INT NOT NULL,
    `CreatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`RoomTypeID`) REFERENCES `RoomTypes`(`RoomTypeID`) ON DELETE CASCADE,
    FOREIGN KEY (`AmenityID`) REFERENCES `Amenities`(`AmenityID`) ON DELETE CASCADE,
    UNIQUE KEY `unique_room_amenity` (`RoomTypeID`, `AmenityID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- KIỂM TRA
-- ============================================================
-- SELECT * FROM RoomAmenities LIMIT 10;
-- SELECT RT.RoomTypeName, A.AmenityName 
-- FROM RoomAmenities RA
-- JOIN RoomTypes RT ON RA.RoomTypeID = RT.RoomTypeID
-- JOIN Amenities A ON RA.AmenityID = A.AmenityID
-- LIMIT 10;
--
-- ============================================================

