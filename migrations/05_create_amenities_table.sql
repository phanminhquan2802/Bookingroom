-- ============================================================
-- Migration: Tạo bảng Amenities (Tiện nghi)
-- Ngày tạo: 2025-01-XX
-- ============================================================
-- 
-- Bảng này lưu danh sách các tiện nghi có thể có trong phòng
-- Ví dụ: WiFi miễn phí, Điều hòa, Máy giặt, TV, Bếp, etc.
--
-- ============================================================

-- Tạo bảng Amenities
CREATE TABLE IF NOT EXISTS `Amenities` (
    `AmenityID` INT AUTO_INCREMENT PRIMARY KEY,
    `AmenityName` VARCHAR(100) NOT NULL UNIQUE, -- Tên tiện nghi
    `IconClass` VARCHAR(50),                    -- Class icon (FontAwesome hoặc custom)
    `Category` VARCHAR(50),                      -- Nhóm tiện nghi (Basic, Kitchen, Bathroom, etc.)
    `IsDeleted` TINYINT DEFAULT 0,
    `CreatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Thêm các tiện nghi phổ biến
INSERT INTO Amenities (AmenityName, IconClass, Category) VALUES
-- Tiện nghi cơ bản
('WiFi miễn phí', 'fa-wifi', 'Basic'),
('Điều hòa không khí', 'fa-snowflake', 'Basic'),
('Sưởi ấm', 'fa-fire', 'Basic'),
('TV màn hình phẳng', 'fa-tv', 'Basic'),
('Máy sấy tóc', 'fa-wind', 'Basic'),

-- Phòng tắm
('Phòng tắm riêng', 'fa-bath', 'Bathroom'),
('Bồn tắm hoặc Vòi sen', 'fa-shower', 'Bathroom'),
('Đồ vệ sinh', 'fa-pump-soap', 'Bathroom'),
('Khăn tắm', 'fa-tshirt', 'Bathroom'),

-- Bếp
('Bếp', 'fa-utensils', 'Kitchen'),
('Đồ bếp', 'fa-blender', 'Kitchen'),
('Lò vi sóng', 'fa-microphone', 'Kitchen'),
('Tủ lạnh', 'fa-igloo', 'Kitchen'),
('Minibar', 'fa-wine-bottle', 'Kitchen'),

-- Không gian
('Ban công', 'fa-door-open', 'Space'),
('Sân hiên', 'fa-home', 'Space'),
('Studio nguyên căn', 'fa-building', 'Space'),
('Nhìn ra địa danh nổi tiếng', 'fa-mountain', 'Space'),
('Nhìn ra biển', 'fa-water', 'Space'),
('Nhìn ra thành phố', 'fa-city', 'Space'),

-- Giặt ủi
('Máy giặt', 'fa-tshirt', 'Laundry'),
('Dịch vụ giặt ủi', 'fa-tshirt', 'Laundry'),

-- An ninh
('Két an toàn', 'fa-lock', 'Security'),
('Khóa cửa điện tử', 'fa-key', 'Security'),

-- Giải trí
('Xe đạp miễn phí', 'fa-bicycle', 'Entertainment'),
('Bàn làm việc', 'fa-laptop', 'Entertainment'),
('Điện thoại', 'fa-phone', 'Entertainment'),

-- Khác
('Không hút thuốc', 'fa-ban-smoking', 'Other'),
('Thang máy', 'fa-elevator', 'Other'),
('Bãi đỗ xe', 'fa-parking', 'Other'),
('Dịch vụ dọn phòng', 'fa-broom', 'Other')

ON DUPLICATE KEY UPDATE
    AmenityName = VALUES(AmenityName),
    IconClass = VALUES(IconClass),
    Category = VALUES(Category);

-- ============================================================
-- KIỂM TRA
-- ============================================================
-- SELECT * FROM Amenities WHERE IsDeleted = 0;
-- SELECT Category, COUNT(*) as SoLuong FROM Amenities WHERE IsDeleted = 0 GROUP BY Category;
--
-- ============================================================

