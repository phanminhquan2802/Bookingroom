-- Migration: Thêm trường IsLocked vào bảng Accounts
-- Mục đích: Thay vì xóa tài khoản khách hàng, sẽ khóa tài khoản
-- Date: 2025-01-XX

-- Thêm cột IsLocked vào bảng Accounts
ALTER TABLE Accounts
ADD COLUMN IsLocked TINYINT(1) DEFAULT 0 COMMENT '0: Mở khóa, 1: Đã khóa';

-- Cập nhật các tài khoản hiện tại (nếu có) để đảm bảo giá trị mặc định
UPDATE Accounts SET IsLocked = 0 WHERE IsLocked IS NULL;

