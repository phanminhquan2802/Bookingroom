-- ============================================================
-- Migration: Thêm quản lý số lượng phòng (Room Availability)
-- File: 11_add_available_rooms.sql
-- Mô tả: Thêm cột AvailableRooms vào bảng RoomTypes để lưu số lượng phòng còn lại
-- ============================================================

-- ============================================================
-- BƯỚC 1: Thêm cột AvailableRooms vào bảng RoomTypes
-- ============================================================
SET @col_exists = (SELECT COUNT(*) 
                   FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'RoomTypes' 
                   AND COLUMN_NAME = 'AvailableRooms');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE RoomTypes ADD COLUMN AvailableRooms INT DEFAULT 10 AFTER MaxGuests',
    'SELECT "Column AvailableRooms already exists in RoomTypes" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cập nhật giá trị mặc định cho các room types hiện có (nếu cột mới được tạo)
UPDATE RoomTypes 
SET AvailableRooms = 10 
WHERE AvailableRooms IS NULL OR AvailableRooms = 0;

-- ============================================================
-- KẾT QUẢ
-- ============================================================
SELECT 'Migration completed: AvailableRooms column added to RoomTypes' AS result;

-- ============================================================
-- KIỂM TRA
-- ============================================================
-- DESCRIBE RoomTypes;
-- SELECT RoomTypeID, RoomTypeName, AvailableRooms FROM RoomTypes LIMIT 5;

