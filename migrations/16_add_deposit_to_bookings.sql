-- Migration: Thêm cột đặt cọc vào bảng Bookings

-- 1. Thêm cột DepositAmount (Số tiền đặt cọc)
SET @col_exists_amount = (SELECT COUNT(*)
                          FROM INFORMATION_SCHEMA.COLUMNS
                          WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'Bookings'
                          AND COLUMN_NAME = 'DepositAmount');

SET @sql_amount = IF(@col_exists_amount = 0,
    'ALTER TABLE Bookings ADD COLUMN DepositAmount DECIMAL(10, 0) DEFAULT 0 AFTER RoomInspection',
    'SELECT "Column DepositAmount already exists" AS message');

PREPARE stmt_amount FROM @sql_amount;
EXECUTE stmt_amount;
DEALLOCATE PREPARE stmt_amount;

-- 2. Thêm cột DepositStatus (Trạng thái đặt cọc: 'none', 'pending', 'confirmed')
SET @col_exists_status = (SELECT COUNT(*)
                          FROM INFORMATION_SCHEMA.COLUMNS
                          WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'Bookings'
                          AND COLUMN_NAME = 'DepositStatus');

SET @sql_status = IF(@col_exists_status = 0,
    'ALTER TABLE Bookings ADD COLUMN DepositStatus ENUM(''none'', ''pending'', ''confirmed'') DEFAULT ''none'' AFTER DepositAmount',
    'SELECT "Column DepositStatus already exists" AS message');

PREPARE stmt_status FROM @sql_status;
EXECUTE stmt_status;
DEALLOCATE PREPARE stmt_status;

-- 3. Thêm cột DepositInfo (Thông tin chuyển khoản: số tài khoản, tên ngân hàng, nội dung)
SET @col_exists_info = (SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'Bookings'
                        AND COLUMN_NAME = 'DepositInfo');

SET @sql_info = IF(@col_exists_info = 0,
    'ALTER TABLE Bookings ADD COLUMN DepositInfo TEXT NULL AFTER DepositStatus',
    'SELECT "Column DepositInfo already exists" AS message');

PREPARE stmt_info FROM @sql_info;
EXECUTE stmt_info;
DEALLOCATE PREPARE stmt_info;

SELECT 'Migration completed: DepositAmount, DepositStatus, and DepositInfo added to Bookings' AS result;

