-- Migration: Thêm role Staff và bảng phân công nhân viên - khách sạn

-- 1. Thêm role Staff vào bảng Roles (nếu chưa có)
INSERT INTO Roles (RoleID, RoleName) 
SELECT 3, 'Staff'
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE RoleID = 3);

-- 2. Tạo bảng StaffHotels để lưu phân công nhân viên quản lý khách sạn
CREATE TABLE IF NOT EXISTS StaffHotels (
    StaffHotelID INT AUTO_INCREMENT PRIMARY KEY,
    StaffID INT NOT NULL,
    HotelID INT NOT NULL,
    AssignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    AssignedBy INT NULL, -- Admin nào phân công
    IsActive TINYINT(1) DEFAULT 1, -- 1 = đang hoạt động, 0 = đã gỡ phân công
    FOREIGN KEY (StaffID) REFERENCES Accounts(AccountID) ON DELETE CASCADE,
    FOREIGN KEY (HotelID) REFERENCES Rooms(RoomID) ON DELETE CASCADE,
    FOREIGN KEY (AssignedBy) REFERENCES Accounts(AccountID) ON DELETE SET NULL,
    UNIQUE KEY unique_staff_hotel (StaffID, HotelID, IsActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tạo index để tối ưu truy vấn
CREATE INDEX idx_staff_hotel_active ON StaffHotels(StaffID, IsActive);
CREATE INDEX idx_hotel_staff_active ON StaffHotels(HotelID, IsActive);

SELECT 'Migration completed: Staff role and StaffHotels table created' AS result;

