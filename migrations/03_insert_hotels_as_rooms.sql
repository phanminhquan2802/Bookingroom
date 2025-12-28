-- ============================================================
-- Migration: Thêm Hotels vào bảng Rooms
-- Ngày tạo: 2025-01-XX
-- ============================================================
-- 
-- LƯU Ý: Trong hệ thống này, bảng Rooms = Hotels
-- Mỗi record trong Rooms là một khách sạn/hotel/villa
-- 
-- File này sẽ thêm 20 hotels/khách sạn/villa vào bảng Rooms
--
-- ============================================================

-- Đảm bảo Categories đã có dữ liệu (chạy file 01 trước)

-- Thêm 20 Hotels/Khách sạn/Villa vào bảng Rooms
INSERT INTO Rooms (
    RoomName, CategoryID, Price, Status, Description, ImageURL, 
    Address, Latitude, Longitude, IsDeleted
) VALUES
-- Khách sạn ở TP. Hồ Chí Minh
('Grand Hotel Saigon', 1, 2500000, 'available', 
 'Khách sạn 5 sao sang trọng tại trung tâm thành phố, gần các điểm du lịch nổi tiếng. Có hồ bơi, spa, nhà hàng.',
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 
 '8 Đồng Khởi, Quận 1, TP. Hồ Chí Minh', 10.7769, 106.7009, 0),

('Riverside Hotel', 1, 1800000, 'available',
 'Khách sạn 4 sao bên bờ sông Sài Gòn, view đẹp, tiện nghi hiện đại. Gần chợ Bến Thành.',
 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
 '18-19-20 Tôn Đức Thắng, Quận 1, TP. Hồ Chí Minh', 10.7831, 106.7017, 0),

('Saigon Central Hotel', 1, 1500000, 'available',
 'Khách sạn 3 sao tại trung tâm, giá hợp lý, phù hợp du lịch và công tác.',
 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
 '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh', 10.7756, 106.7019, 0),

-- Khách sạn ở Hà Nội
('Hanoi Grand Plaza', 1, 2200000, 'available',
 'Khách sạn 5 sao tại trung tâm Hà Nội, gần các di tích lịch sử. Có spa, fitness center.',
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
 '8 Đường Láng, Đống Đa, Hà Nội', 21.0285, 105.8542, 0),

('Old Quarter Hotel', 1, 1000000, 'available',
 'Khách sạn 3 sao tại phố cổ Hà Nội, không gian ấm cúng, giá hợp lý. Gần Hồ Hoàn Kiếm.',
 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
 '75 Hàng Bồ, Hoàn Kiếm, Hà Nội', 21.0338, 105.8500, 0),

('Hanoi Boutique Hotel', 1, 1200000, 'available',
 'Khách sạn boutique 4 sao, thiết kế hiện đại, phù hợp giới trẻ.',
 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
 '12 Hàng Gai, Hoàn Kiếm, Hà Nội', 21.0308, 105.8505, 0),

-- Khách sạn ở Đà Nẵng
('Danang Beach Resort', 1, 3500000, 'available',
 'Resort 5 sao bên bờ biển, có hồ bơi, spa, nhà hàng hải sản. View biển tuyệt đẹp.',
 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
 '101 Võ Nguyên Giáp, Ngũ Hành Sơn, Đà Nẵng', 16.0544, 108.2022, 0),

('My Khe Hotel', 1, 2000000, 'available',
 'Khách sạn 4 sao gần bãi biển Mỹ Khê, view biển đẹp. Có hồ bơi và nhà hàng.',
 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
 '241 Nguyễn Văn Thoại, Sơn Trà, Đà Nẵng', 16.0472, 108.2468, 0),

('Danang City Hotel', 1, 1300000, 'available',
 'Khách sạn 3 sao tại trung tâm Đà Nẵng, gần sông Hàn, giá hợp lý.',
 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
 '123 Trần Phú, Hải Châu, Đà Nẵng', 16.0678, 108.2208, 0),

-- Khách sạn ở Nha Trang
('Nha Trang Bay Hotel', 1, 2200000, 'available',
 'Khách sạn 4 sao view vịnh Nha Trang, có spa, hồ bơi vô cực. Gần Vinpearl.',
 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
 '12 Trần Phú, Nha Trang, Khánh Hòa', 12.2388, 109.1967, 0),

('Nha Trang Beach Resort', 1, 2800000, 'available',
 'Resort 4 sao bên bờ biển Nha Trang, có hồ bơi, nhà hàng, bar.',
 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
 '78 Trần Phú, Nha Trang, Khánh Hòa', 12.2395, 109.1972, 0),

-- Khách sạn ở Huế
('Imperial Hotel Huế', 1, 1800000, 'available',
 'Khách sạn 4 sao gần sông Hương và các di tích cố đô Huế. Thiết kế cổ điển.',
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
 '8 Hùng Vương, Phú Hội, Huế', 16.4637, 107.5909, 0),

('Huế Heritage Hotel', 1, 1400000, 'available',
 'Khách sạn 3 sao gần Đại Nội Huế, không gian ấm cúng, phù hợp du lịch văn hóa.',
 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
 '15 Lê Lợi, Phú Hội, Huế', 16.4674, 107.5765, 0),

-- Khách sạn ở Đà Lạt
('Dalat Palace Hotel', 1, 2500000, 'available',
 'Khách sạn 5 sao cổ điển tại Đà Lạt, view hồ Xuân Hương, không gian sang trọng.',
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
 '12 Trần Phú, Đà Lạt, Lâm Đồng', 11.9404, 108.4583, 0),

('Dalat Mountain View', 1, 1600000, 'available',
 'Khách sạn 4 sao view núi và thành phố Đà Lạt, không gian yên tĩnh, lãng mạn.',
 'https://images.unsplash.com/photo-1600585154526-990dbe4eb0f3?w=800',
 '45 Phan Đình Phùng, Đà Lạt, Lâm Đồng', 11.9412, 108.4398, 0),

-- Khách sạn ở Vũng Tàu
('Vung Tau Beach Hotel', 1, 1500000, 'available',
 'Khách sạn 3 sao bên bờ biển Vũng Tàu, view biển đẹp, giá hợp lý.',
 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
 '123 Trần Phú, Vũng Tàu, Bà Rịa - Vũng Tàu', 10.3460, 107.0843, 0),

-- Villa nghỉ dưỡng
('Villa Paradise Phú Quốc', 2, 5000000, 'available',
 'Villa biệt lập với hồ bơi riêng, view biển, phù hợp cho gia đình và nhóm bạn. 2-4 phòng ngủ.',
 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
 'Bãi Dài, Phú Quốc, Kiên Giang', 10.2899, 103.9840, 0),

('Villa Sunset Đà Lạt', 2, 3200000, 'available',
 'Villa trên đồi với view thành phố Đà Lạt, không gian yên tĩnh, lãng mạn. Có sân vườn riêng.',
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
 'Đường Trần Hưng Đạo, Đà Lạt, Lâm Đồng', 11.9404, 108.4583, 0),

('Villa Ocean View Nha Trang', 2, 4500000, 'available',
 'Villa view biển Nha Trang, có hồ bơi riêng, phù hợp nhóm lớn. 3-4 phòng ngủ.',
 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
 'Đường Trần Phú, Nha Trang, Khánh Hòa', 12.2388, 109.1967, 0),

('Villa Riverside Hà Nội', 2, 3800000, 'available',
 'Villa bên sông Hồng, không gian rộng rãi, phù hợp gia đình. Có sân vườn và bếp riêng.',
 'https://images.unsplash.com/photo-1600585154526-990dbe4eb0f3?w=800',
 'Đường Long Biên, Long Biên, Hà Nội', 21.0285, 105.8542, 0);

-- ============================================================
-- KIỂM TRA
-- ============================================================
-- SELECT R.RoomID, R.RoomName, C.CategoryName, R.Address, R.Price 
-- FROM Rooms R
-- LEFT JOIN Categories C ON R.CategoryID = C.CategoryID
-- WHERE R.IsDeleted = 0
-- ORDER BY R.RoomID;
--
-- SELECT C.CategoryName, COUNT(*) as SoLuong
-- FROM Rooms R
-- LEFT JOIN Categories C ON R.CategoryID = C.CategoryID
-- WHERE R.IsDeleted = 0
-- GROUP BY C.CategoryName;
--
-- ============================================================

