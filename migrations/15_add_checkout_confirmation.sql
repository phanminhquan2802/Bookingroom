-- Migration: Thêm cột xác nhận check-out và kiểm tra phòng

-- 1. Thêm cột CheckOutConfirmed (đã xác nhận check-out bởi nhân viên)
SET @col_exists_confirmed = (SELECT COUNT(*)
                             FROM INFORMATION_SCHEMA.COLUMNS
                             WHERE TABLE_SCHEMA = DATABASE()
                             AND TABLE_NAME = 'Bookings'
                             AND COLUMN_NAME = 'CheckOutConfirmed');

SET @sql_confirmed = IF(@col_exists_confirmed = 0,
    'ALTER TABLE Bookings ADD COLUMN CheckOutConfirmed TINYINT(1) DEFAULT 0 AFTER Status',
    'SELECT "Column CheckOutConfirmed already exists" AS message');

PREPARE stmt_confirmed FROM @sql_confirmed;
EXECUTE stmt_confirmed;
DEALLOCATE PREPARE stmt_confirmed;

-- 2. Thêm cột RoomInspection (ghi nhận kiểm tra phòng)
SET @col_exists_inspection = (SELECT COUNT(*)
                              FROM INFORMATION_SCHEMA.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Bookings'
                              AND COLUMN_NAME = 'RoomInspection');

SET @sql_inspection = IF(@col_exists_inspection = 0,
    'ALTER TABLE Bookings ADD COLUMN RoomInspection TEXT NULL AFTER CheckOutConfirmed',
    'SELECT "Column RoomInspection already exists" AS message');

PREPARE stmt_inspection FROM @sql_inspection;
EXECUTE stmt_inspection;
DEALLOCATE PREPARE stmt_inspection;

-- 3. Thêm cột CheckInConfirmed (đã xác nhận check-in bởi nhân viên)
SET @col_exists_checkin = (SELECT COUNT(*)
                           FROM INFORMATION_SCHEMA.COLUMNS
                           WHERE TABLE_SCHEMA = DATABASE()
                           AND TABLE_NAME = 'Bookings'
                           AND COLUMN_NAME = 'CheckInConfirmed');

SET @sql_checkin = IF(@col_exists_checkin = 0,
    'ALTER TABLE Bookings ADD COLUMN CheckInConfirmed TINYINT(1) DEFAULT 0 AFTER CheckOutConfirmed',
    'SELECT "Column CheckInConfirmed already exists" AS message');

PREPARE stmt_checkin FROM @sql_checkin;
EXECUTE stmt_checkin;
DEALLOCATE PREPARE stmt_checkin;

SELECT 'Migration completed: CheckOutConfirmed, CheckInConfirmed, and RoomInspection added to Bookings' AS result;

