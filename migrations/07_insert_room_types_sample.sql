-- ============================================================
-- Migration: Thêm dữ liệu mẫu cho RoomTypes
-- Ngày tạo: 2025-01-XX
-- ============================================================
-- 
-- File này sẽ thêm các loại phòng cho các hotels/villas
-- Dựa trên ảnh mẫu: Studio Có Sân Hiên với đầy đủ tiện nghi
--
-- LƯU Ý: Cần có dữ liệu Hotels trong bảng Rooms trước
-- HotelID sẽ là RoomID của hotel/villa trong bảng Rooms
--
-- ============================================================

-- Giả sử có các hotels với RoomID từ 1-20 (từ file 03_insert_hotels_as_rooms.sql)
-- Thêm các loại phòng cho mỗi hotel

-- Hotel 1: Grand Hotel Saigon (RoomID = 1)
INSERT INTO RoomTypes (HotelID, RoomTypeName, Description, Price, Area, MaxGuests, BedType, BedCount, ImageURL, IsDeleted) VALUES
(1, 'Studio Có Sân Hiên', 'Studio nguyên căn với sân hiên riêng, view thành phố. Có đầy đủ tiện nghi hiện đại.', 2500000, 30.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 0),
(1, 'Phòng Deluxe', 'Phòng Deluxe rộng rãi, view thành phố, có ban công. Nội thất sang trọng.', 3500000, 35.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', 0),
(1, 'Phòng Executive Suite', 'Suite cao cấp với phòng khách riêng, view đẹp. Phù hợp cho doanh nhân.', 5500000, 50.00, 3, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', 0);

-- Hotel 2: Riverside Hotel (RoomID = 2)
INSERT INTO RoomTypes (HotelID, RoomTypeName, Description, Price, Area, MaxGuests, BedType, BedCount, ImageURL, IsDeleted) VALUES
(2, 'Phòng Superior View River', 'Phòng view sông Sài Gòn, ban công riêng. Không gian yên tĩnh.', 1800000, 28.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800', 0),
(2, 'Phòng Standard', 'Phòng tiêu chuẩn, đầy đủ tiện nghi cơ bản. Giá hợp lý.', 1200000, 22.00, 2, '1 giường đôi', 1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 0);

-- Hotel 3: Hanoi Grand Plaza (RoomID = 3)
INSERT INTO RoomTypes (HotelID, RoomTypeName, Description, Price, Area, MaxGuests, BedType, BedCount, ImageURL, IsDeleted) VALUES
(3, 'Phòng Premier', 'Phòng Premier sang trọng, view trung tâm Hà Nội. Nội thất hiện đại.', 2200000, 32.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', 0),
(3, 'Phòng Junior Suite', 'Suite với phòng khách và phòng ngủ riêng biệt. Không gian rộng rãi.', 3800000, 45.00, 3, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 0),
(3, 'Phòng Deluxe', 'Phòng Deluxe rộng rãi, nội thất hiện đại. View thành phố.', 2800000, 30.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', 0);

-- Hotel 4: Old Quarter Hotel (RoomID = 4)
INSERT INTO RoomTypes (HotelID, RoomTypeName, Description, Price, Area, MaxGuests, BedType, BedCount, ImageURL, IsDeleted) VALUES
(4, 'Phòng Standard', 'Phòng tiêu chuẩn tại phố cổ, giá hợp lý. Không gian ấm cúng.', 800000, 18.00, 2, '1 giường đôi', 1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 0),
(4, 'Phòng Superior', 'Phòng Superior với view phố cổ. Tiện nghi đầy đủ.', 1000000, 22.00, 2, '1 giường đôi', 1, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', 0);

-- Hotel 5: Danang Beach Resort (RoomID = 5)
INSERT INTO RoomTypes (HotelID, RoomTypeName, Description, Price, Area, MaxGuests, BedType, BedCount, ImageURL, IsDeleted) VALUES
(5, 'Bungalow View Biển', 'Bungalow riêng biệt, view biển trực tiếp, có ban công. Không gian yên tĩnh.', 3500000, 40.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800', 0),
(5, 'Villa Biệt Lập', 'Villa riêng với hồ bơi, view biển tuyệt đẹp. Phù hợp gia đình.', 6500000, 80.00, 4, '2 giường đôi lớn', 2, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 0),
(5, 'Phòng Deluxe Ocean View', 'Phòng Deluxe view đại dương, ban công lớn. Tiện nghi cao cấp.', 2800000, 35.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', 0);

-- Hotel 6: My Khe Hotel (RoomID = 6)
INSERT INTO RoomTypes (HotelID, RoomTypeName, Description, Price, Area, MaxGuests, BedType, BedCount, ImageURL, IsDeleted) VALUES
(6, 'Phòng Superior Sea View', 'Phòng view biển Mỹ Khê, ban công riêng. Không gian thoáng mát.', 2000000, 28.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800', 0),
(6, 'Phòng Deluxe', 'Phòng Deluxe rộng rãi, đầy đủ tiện nghi. View đẹp.', 2500000, 30.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 0);

-- Villa 7: Villa Paradise Phú Quốc (RoomID = 7)
INSERT INTO RoomTypes (HotelID, RoomTypeName, Description, Price, Area, MaxGuests, BedType, BedCount, ImageURL, IsDeleted) VALUES
(7, 'Villa 2 Phòng Ngủ', 'Villa 2 phòng ngủ, hồ bơi riêng, view biển. Phù hợp gia đình nhỏ.', 5000000, 120.00, 4, '2 giường đôi lớn', 2, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 0),
(7, 'Villa 3 Phòng Ngủ', 'Villa 3 phòng ngủ, sân vườn rộng, hồ bơi. Không gian lý tưởng cho nhóm lớn.', 7500000, 180.00, 6, '3 giường đôi lớn', 3, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 0),
(7, 'Villa 4 Phòng Ngủ', 'Villa 4 phòng ngủ, phù hợp nhóm lớn, đầy đủ tiện nghi. Hồ bơi và sân vườn riêng.', 10000000, 250.00, 8, '4 giường đôi lớn', 4, 'https://images.unsplash.com/photo-1600585154526-990dbe4eb0f3?w=800', 0);

-- Villa 8: Villa Sunset Đà Lạt (RoomID = 8)
INSERT INTO RoomTypes (HotelID, RoomTypeName, Description, Price, Area, MaxGuests, BedType, BedCount, ImageURL, IsDeleted) VALUES
(8, 'Villa View Đồi', 'Villa view đồi thông, không gian yên tĩnh, lãng mạn. Sân vườn riêng.', 3200000, 100.00, 4, '2 giường đôi lớn', 2, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 0),
(8, 'Villa Garden', 'Villa với sân vườn riêng, view thành phố Đà Lạt. Không gian ấm cúng.', 2800000, 90.00, 3, '1 giường đôi lớn, 1 giường đơn', 2, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 0);

-- Hotel 9: Nha Trang Bay Hotel (RoomID = 9)
INSERT INTO RoomTypes (HotelID, RoomTypeName, Description, Price, Area, MaxGuests, BedType, BedCount, ImageURL, IsDeleted) VALUES
(9, 'Phòng Ocean Suite', 'Suite view vịnh Nha Trang, ban công lớn. Tiện nghi cao cấp.', 3000000, 40.00, 3, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', 0),
(9, 'Phòng Deluxe Bay View', 'Phòng Deluxe view vịnh, đầy đủ tiện nghi. Không gian rộng rãi.', 2200000, 32.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', 0),
(9, 'Phòng Superior', 'Phòng Superior, giá hợp lý, view đẹp. Tiện nghi đầy đủ.', 1800000, 28.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 0);

-- Hotel 10: Imperial Hotel Huế (RoomID = 10)
INSERT INTO RoomTypes (HotelID, RoomTypeName, Description, Price, Area, MaxGuests, BedType, BedCount, ImageURL, IsDeleted) VALUES
(10, 'Phòng Deluxe River View', 'Phòng Deluxe view sông Hương, gần các di tích. Thiết kế cổ điển.', 2000000, 30.00, 2, '1 giường đôi lớn', 1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 0),
(10, 'Phòng Superior', 'Phòng Superior, không gian ấm cúng, giá hợp lý. View đẹp.', 1500000, 25.00, 2, '1 giường đôi', 1, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', 0);

-- ============================================================
-- KIỂM TRA
-- ============================================================
-- SELECT RT.*, R.RoomName as HotelName 
-- FROM RoomTypes RT
-- JOIN Rooms R ON RT.HotelID = R.RoomID
-- WHERE RT.IsDeleted = 0
-- LIMIT 10;
--
-- SELECT R.RoomName, COUNT(RT.RoomTypeID) as SoLoaiPhong
-- FROM Rooms R
-- LEFT JOIN RoomTypes RT ON R.RoomID = RT.HotelID AND RT.IsDeleted = 0
-- WHERE R.IsDeleted = 0
-- GROUP BY R.RoomID, R.RoomName
-- ORDER BY R.RoomID;
--
-- ============================================================

