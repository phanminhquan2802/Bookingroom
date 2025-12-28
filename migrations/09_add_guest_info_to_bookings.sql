-- Migration: Thêm thông tin khách hàng vào bảng Bookings
-- File: 09_add_guest_info_to_bookings.sql
-- Mô tả: Thêm các cột để lưu thông tin khách hàng bổ sung (tên, email, số điện thoại, yêu cầu đặc biệt, thời gian đến)

-- Kiểm tra và thêm cột GuestName (nếu chưa có)
SET @col_exists = (SELECT COUNT(*) 
                   FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'Bookings' 
                   AND COLUMN_NAME = 'GuestName');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE Bookings ADD COLUMN GuestName VARCHAR(200) NULL AFTER Rooms',
    'SELECT "Column GuestName already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột GuestEmail (nếu chưa có)
SET @col_exists = (SELECT COUNT(*) 
                   FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'Bookings' 
                   AND COLUMN_NAME = 'GuestEmail');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE Bookings ADD COLUMN GuestEmail VARCHAR(255) NULL AFTER GuestName',
    'SELECT "Column GuestEmail already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột GuestPhone (nếu chưa có)
SET @col_exists = (SELECT COUNT(*) 
                   FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'Bookings' 
                   AND COLUMN_NAME = 'GuestPhone');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE Bookings ADD COLUMN GuestPhone VARCHAR(50) NULL AFTER GuestEmail',
    'SELECT "Column GuestPhone already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột SpecialRequests (nếu chưa có)
SET @col_exists = (SELECT COUNT(*) 
                   FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'Bookings' 
                   AND COLUMN_NAME = 'SpecialRequests');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE Bookings ADD COLUMN SpecialRequests TEXT NULL AFTER GuestPhone',
    'SELECT "Column SpecialRequests already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột ArrivalTime (nếu chưa có)
SET @col_exists = (SELECT COUNT(*) 
                   FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'Bookings' 
                   AND COLUMN_NAME = 'ArrivalTime');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE Bookings ADD COLUMN ArrivalTime VARCHAR(10) NULL AFTER SpecialRequests',
    'SELECT "Column ArrivalTime already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Hiển thị kết quả
SELECT 'Migration completed: Guest info columns added to Bookings table' AS result;

