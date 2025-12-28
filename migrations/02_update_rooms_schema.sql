-- ============================================================
-- Migration: Cập nhật bảng Rooms (Rooms = Hotels trong hệ thống)
-- Ngày tạo: 2025-01-XX
-- ============================================================
-- 
-- LƯU Ý: Trong hệ thống này, bảng Rooms đóng vai trò như Hotels
-- Mỗi record trong Rooms = 1 khách sạn/hotel/villa
-- 
-- File này sẽ đảm bảo bảng Rooms có đầy đủ các cột cần thiết:
-- - CategoryID (loại: Khách sạn, Villa)
-- - Address (địa chỉ)
-- - Latitude, Longitude (tọa độ)
-- - IsDeleted (soft delete)
--
-- ============================================================

-- Thêm cột CategoryID vào Rooms (nếu chưa có)
-- Lưu ý: Nếu cột đã tồn tại, sẽ báo lỗi "Duplicate column name" - BỎ QUA lỗi đó
ALTER TABLE Rooms
ADD COLUMN CategoryID INT NULL AFTER RoomName;

-- Thêm Foreign Key cho CategoryID (nếu chưa có)
-- Lưu ý: Nếu foreign key đã tồn tại, sẽ báo lỗi "Duplicate foreign key" - BỎ QUA lỗi đó
ALTER TABLE Rooms
ADD CONSTRAINT fk_rooms_category 
FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE SET NULL;

-- Thêm cột Address vào Rooms (nếu chưa có)
ALTER TABLE Rooms
ADD COLUMN Address VARCHAR(255) NULL AFTER ImageURL;

-- Thêm cột IsDeleted vào Rooms (nếu chưa có)
ALTER TABLE Rooms
ADD COLUMN IsDeleted TINYINT DEFAULT 0 AFTER ImageURL;

-- Thêm cột Latitude vào Rooms (nếu chưa có)
ALTER TABLE Rooms
ADD COLUMN Latitude DECIMAL(10, 8) NULL AFTER IsDeleted;

-- Thêm cột Longitude vào Rooms (nếu chưa có)
ALTER TABLE Rooms
ADD COLUMN Longitude DECIMAL(11, 8) NULL AFTER Latitude;

-- Cập nhật giá trị mặc định cho CategoryID (nếu NULL)
UPDATE Rooms SET CategoryID = 1 WHERE CategoryID IS NULL;

-- ============================================================
-- KIỂM TRA
-- ============================================================
-- DESCRIBE Rooms;
-- SELECT RoomID, RoomName, CategoryID, Address, Latitude, Longitude, Price, Status 
-- FROM Rooms 
-- LIMIT 5;
--
-- ============================================================

