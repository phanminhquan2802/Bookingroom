-- ============================================================
-- Migration: Thêm Categories (Loại chỗ ở)
-- Ngày tạo: 2025-01-XX
-- ============================================================
-- 
-- File này sẽ thêm các loại chỗ ở:
-- - Khách sạn
-- - Villa
--
-- ============================================================

-- Đảm bảo bảng Categories tồn tại
CREATE TABLE IF NOT EXISTS `Categories` (
    `CategoryID` INT AUTO_INCREMENT PRIMARY KEY,
    `CategoryName` VARCHAR(100) NOT NULL,
    `Description` TEXT,
    `IsDeleted` TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Thêm cột IsDeleted nếu chưa có
ALTER TABLE Categories
ADD COLUMN IsDeleted TINYINT DEFAULT 0;

-- Thêm 2 categories
INSERT INTO Categories (CategoryID, CategoryName, Description, IsDeleted) VALUES
(1, 'Khách sạn', 'Hotel - Chỗ nghỉ khách sạn với đầy đủ tiện nghi', 0),
(2, 'Villa', 'Villa - Biệt thự nghỉ dưỡng riêng tư', 0)
ON DUPLICATE KEY UPDATE
    CategoryName = VALUES(CategoryName),
    Description = VALUES(Description),
    IsDeleted = VALUES(IsDeleted);

-- ============================================================
-- KIỂM TRA
-- ============================================================
-- SELECT * FROM Categories WHERE IsDeleted = 0;
-- Kết quả mong đợi: 2 categories (Khách sạn, Villa)
--
-- ============================================================

