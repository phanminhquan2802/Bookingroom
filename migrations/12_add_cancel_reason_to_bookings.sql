-- ============================================================
-- Migration: Thêm cột CancelReason vào bảng Bookings
-- File: 12_add_cancel_reason_to_bookings.sql
-- Mô tả: Thêm cột CancelReason để lưu lý do hủy đơn
-- ============================================================

-- Kiểm tra và thêm cột CancelReason nếu chưa tồn tại
SET @col_exists = (SELECT COUNT(*) 
                   FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'Bookings' 
                   AND COLUMN_NAME = 'CancelReason');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE Bookings ADD COLUMN CancelReason TEXT NULL AFTER Status',
    'SELECT "Column CancelReason already exists in Bookings" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed: CancelReason column added to Bookings' AS result;

-- ============================================================
-- KIỂM TRA
-- ============================================================
-- DESCRIBE Bookings;
-- SELECT BookingID, Status, CancelReason FROM Bookings WHERE Status = 'Cancelled' LIMIT 5;

