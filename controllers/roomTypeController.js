const db = require('../config/db');

// --- PUBLIC: LẤY CÁC LOẠI PHÒNG THEO HOTEL ---
exports.getRoomTypesByHotel = (req, res) => {
    const hotelId = req.params.hotelId;
    const { adults, children, rooms, checkIn, checkOut } = req.query;
    
    // Debug: Log query params
    console.log('getRoomTypesByHotel - Query params:', { hotelId, adults, children, rooms, checkIn, checkOut });
    
    // Parse số người và phòng nếu có
    const adultsNum = adults ? parseInt(adults) : null;
    const childrenNum = children ? parseInt(children) : null;
    const roomsNum = rooms ? parseInt(rooms) : null;
    const totalGuests = (adultsNum !== null && childrenNum !== null) ? (adultsNum + childrenNum) : null;
    
    // QUAN TRỌNG: Chỉ lấy RoomTypes của hotel này (RT.HotelID = ?)
    // Tính số phòng thực sự available trong khoảng thời gian tìm kiếm (nếu có checkIn/checkOut)
    const params = [];
    
    // Xây dựng SELECT clause
    let sql = `
        SELECT RT.*, 
               COUNT(DISTINCT RA.AmenityID) as AmenityCount,
               IFNULL(RT.AvailableRooms, 10) as AvailableRooms`;
    
    // Nếu có checkIn và checkOut, tính số phòng thực sự available trong khoảng thời gian đó
    // QUAN TRỌNG: Tính từ tổng số phòng ban đầu (AvailableRooms + số phòng đã đặt) 
    // trừ đi số phòng đã đặt trong khoảng thời gian tìm kiếm
    // Logic overlap: 2 khoảng thời gian overlap nếu: bookingStart < searchEnd AND bookingEnd > searchStart
    if (checkIn && checkOut) {
        sql += `,
               ((IFNULL(RT.AvailableRooms, 10) + COALESCE(
                   (SELECT SUM(B.Rooms) 
                    FROM Bookings B 
                    WHERE B.RoomTypeID = RT.RoomTypeID 
                    AND B.Status IN ('Pending', 'Confirmed', 'CheckedIn')
                   ), 0
               )) - COALESCE(
                   (SELECT SUM(B.Rooms) 
                    FROM Bookings B 
                    WHERE B.RoomTypeID = RT.RoomTypeID 
                    AND B.Status IN ('Pending', 'Confirmed', 'CheckedIn')
                    AND B.CheckInDate < ? 
                    AND B.CheckOutDate > ?
                   ), 0
               )) as ActualAvailableRooms`;
        // Thêm params cho subquery: searchCheckOut, searchCheckIn
        // Logic: 
        // 1. Tính tổng số phòng = AvailableRooms (hiện tại) + số phòng đã đặt (tất cả booking active)
        // 2. Trừ đi số phòng đã đặt trong khoảng thời gian tìm kiếm
        // Ví dụ: AvailableRooms = 3, có booking 29-30 (1 phòng)
        //   - Tổng = 3 + 1 = 4
        //   - Tìm kiếm 2-3: không có booking nào trong 2-3 → ActualAvailableRooms = 4 - 0 = 4 ✓
        //   - Tìm kiếm 28-30: có booking 29-30 trong 28-30 → ActualAvailableRooms = 4 - 1 = 3 ✓
        params.push(checkOut, checkIn);
    }
    
    sql += `
        FROM RoomTypes RT
        LEFT JOIN RoomAmenities RA ON RT.RoomTypeID = RA.RoomTypeID
        WHERE RT.HotelID = ? AND RT.IsDeleted = 0`;
    
    // Thêm hotelId vào params
    params.push(hotelId);
    
    // Thêm điều kiện WHERE cho MaxGuests (luôn dùng WHERE vì là column thực)
    if (roomsNum !== null && roomsNum > 0 && totalGuests !== null && totalGuests > 0) {
        sql += ` AND (IFNULL(RT.MaxGuests, 2) * ?) >= ?`;
        params.push(roomsNum, totalGuests);
    }
    
    // Thêm điều kiện WHERE cho AvailableRooms (nếu không có checkIn/checkOut)
    if (!checkIn || !checkOut) {
        if (roomsNum !== null && roomsNum > 0 && totalGuests !== null && totalGuests > 0) {
            sql += ` AND IFNULL(RT.AvailableRooms, 10) >= ?`;
            params.push(roomsNum);
        } else {
            sql += ` AND IFNULL(RT.AvailableRooms, 10) > 0`;
        }
    }
    
    sql += ` GROUP BY RT.RoomTypeID`;
    
    // Nếu có checkIn/checkOut, dùng HAVING để filter ActualAvailableRooms (sau GROUP BY)
    if (checkIn && checkOut) {
        if (roomsNum !== null && roomsNum > 0 && totalGuests !== null && totalGuests > 0) {
            sql += ` HAVING ActualAvailableRooms >= ?`;
            params.push(roomsNum);
        } else {
            sql += ` HAVING ActualAvailableRooms > 0`;
        }
    }
    
    sql += ` ORDER BY RT.Price ASC`;
    
    // Debug: Log SQL và params
    console.log('SQL Query:', sql);
    console.log('Params:', params);
    console.log('Has checkIn/checkOut:', !!(checkIn && checkOut));
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Lỗi lấy loại phòng:', err);
            console.error('SQL:', sql);
            console.error('Params:', params);
            
            // Nếu bảng chưa tồn tại, trả về mảng rỗng thay vì lỗi
            if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes("doesn't exist")) {
                console.log('Bảng RoomTypes chưa được tạo. Vui lòng chạy migration.');
                return res.json([]);
            }
            
            return res.status(500).json({ 
                error: 'Lỗi lấy loại phòng: ' + err.message
            });
        }
        
        // Debug: Log kết quả
        console.log(`Found ${results.length} room types for hotel ${hotelId}`);
        if (checkIn && checkOut && results.length > 0) {
            console.log('Search dates:', { checkIn, checkOut });
            results.forEach((rt, idx) => {
                console.log(`RoomType ${idx + 1} (ID: ${rt.RoomTypeID}):`, {
                    Name: rt.RoomTypeName,
                    AvailableRooms: rt.AvailableRooms,
                    ActualAvailableRooms: rt.ActualAvailableRooms,
                    Difference: rt.AvailableRooms - (rt.ActualAvailableRooms || rt.AvailableRooms)
                });
            });
        }
        
        // Trả về mảng rỗng nếu không có dữ liệu
        res.json(results || []);
    });
};

// --- PUBLIC: LẤY CHI TIẾT LOẠI PHÒNG ---
exports.getRoomTypeDetail = (req, res) => {
    const roomTypeId = req.params.id;
    
    const sql = `
        SELECT RT.*, 
               R.RoomName as HotelName,
               R.Address as HotelAddress,
               R.ImageURL as HotelImage,
               C.CategoryName
        FROM RoomTypes RT
        JOIN Rooms R ON RT.HotelID = R.RoomID
        LEFT JOIN Categories C ON R.CategoryID = C.CategoryID
        WHERE RT.RoomTypeID = ? AND RT.IsDeleted = 0
    `;
    
    db.query(sql, [roomTypeId], (err, results) => {
        if (err) {
            console.error('Lỗi lấy chi tiết loại phòng:', err);
            return res.status(500).json({ error: 'Lỗi lấy chi tiết loại phòng: ' + err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy loại phòng.' });
        }
        
        res.json(results[0]);
    });
};

// --- PUBLIC: LẤY TIỆN NGHI CỦA LOẠI PHÒNG ---
exports.getRoomTypeAmenities = (req, res) => {
    const roomTypeId = req.params.id;
    
    const sql = `
        SELECT A.*
        FROM Amenities A
        JOIN RoomAmenities RA ON A.AmenityID = RA.AmenityID
        WHERE RA.RoomTypeID = ? AND A.IsDeleted = 0
        ORDER BY A.Category, A.AmenityName
    `;
    
    db.query(sql, [roomTypeId], (err, results) => {
        if (err) {
            console.error('Lỗi lấy tiện nghi:', err);
            // Nếu bảng chưa tồn tại, trả về mảng rỗng thay vì lỗi
            if (err.code === 'ER_NO_SUCH_TABLE') {
                return res.json([]);
            }
            return res.status(500).json({ error: 'Lỗi lấy tiện nghi: ' + err.message });
        }
        res.json(results || []);
    });
};

// --- PUBLIC: LẤY PHÒNG TRỐNG THEO LOẠI PHÒNG ---
exports.getAvailableRoomTypes = (req, res) => {
    const { checkIn, checkOut, hotelId, adults, children, rooms } = req.query;
    
    if (!checkIn || !checkOut) {
        return res.status(400).json({ error: "Vui lòng cung cấp checkIn và checkOut!" });
    }
    
    const checkInObj = new Date(checkIn);
    const checkOutObj = new Date(checkOut);
    
    if (isNaN(checkInObj.getTime()) || isNaN(checkOutObj.getTime())) {
        return res.status(400).json({ error: "Ngày tháng không hợp lệ!" });
    }
    
    if (checkInObj >= checkOutObj) {
        return res.status(400).json({ error: "Ngày check-out phải sau ngày check-in!" });
    }
    
    // Parse số người và phòng
    const adultsNum = parseInt(adults) || 2;
    const childrenNum = parseInt(children) || 0;
    const roomsNum = parseInt(rooms) || 1;
    const totalGuests = adultsNum + childrenNum;
    
    // Filter RoomType theo:
    // 1. AvailableRooms >= số phòng cần đặt
    // 2. MaxGuests * số phòng >= tổng số người
    let sql = `
        SELECT RT.*,
               R.RoomName as HotelName,
               COUNT(DISTINCT RA.AmenityID) as AmenityCount,
               IFNULL(RT.AvailableRooms, 10) as AvailableRooms
        FROM RoomTypes RT
        JOIN Rooms R ON RT.HotelID = R.RoomID
        LEFT JOIN RoomAmenities RA ON RT.RoomTypeID = RA.RoomTypeID
        WHERE RT.IsDeleted = 0
        AND IFNULL(RT.AvailableRooms, 10) >= ?
        AND (IFNULL(RT.MaxGuests, 2) * ?) >= ?
    `;
    
    const params = [roomsNum, roomsNum, totalGuests];
    
    if (hotelId) {
        sql += " AND RT.HotelID = ?";
        params.push(hotelId);
    }
    
    sql += " GROUP BY RT.RoomTypeID ORDER BY RT.Price ASC";
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Lỗi lấy phòng trống:', err);
            return res.status(500).json({ error: 'Lỗi lấy phòng trống: ' + err.message });
        }
        res.json(results);
    });
};

// --- ADMIN: CRUD ---
exports.getAllRoomTypesAdmin = (req, res) => {
    const sql = `
        SELECT RT.*, R.RoomName as HotelName,
               IFNULL(RT.AvailableRooms, 10) as AvailableRooms
        FROM RoomTypes RT
        JOIN Rooms R ON RT.HotelID = R.RoomID
        WHERE RT.IsDeleted = 0
        ORDER BY RT.HotelID, RT.RoomTypeID
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Lỗi lấy loại phòng:', err);
            console.error('SQL:', sql);
            // Nếu bảng chưa tồn tại, trả về mảng rỗng thay vì lỗi
            if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes("doesn't exist")) {
                console.log('⚠️ Bảng RoomTypes chưa được tạo. Vui lòng chạy migration.');
                return res.json([]);
            }
            return res.status(500).json({ error: 'Lỗi lấy loại phòng: ' + err.message });
        }
        console.log(`✅ Lấy được ${results.length} loại phòng`);
        res.json(results || []);
    });
};

exports.createRoomType = (req, res) => {
    const { hotelId, roomTypeName, price, area, maxGuests, bedType, bedCount, imageURL, description, availableRooms } = req.body;
    
    // Validate
    if (!hotelId || !roomTypeName || !price) {
        return res.status(400).json({ error: "Vui lòng điền đầy đủ: Khách sạn, Tên loại phòng, Giá!" });
    }
    
    if (isNaN(price) || parseFloat(price) <= 0) {
        return res.status(400).json({ error: "Giá phòng phải là số lớn hơn 0!" });
    }
    
    // Kiểm tra hotel có tồn tại không
    db.query('SELECT RoomID FROM Rooms WHERE RoomID = ? AND IsDeleted = 0', [hotelId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Lỗi kiểm tra khách sạn: " + err.message });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: "Khách sạn không tồn tại!" });
        }
        
        // Insert RoomType
        // Kiểm tra xem cột AvailableRooms có tồn tại không
        let sql = `INSERT INTO RoomTypes (HotelID, RoomTypeName, Price, Area, MaxGuests, BedType, BedCount, ImageURL, Description`;
        let values = `VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?`;
        let params = [
            hotelId,
            roomTypeName.trim(),
            price,
            area || null,
            maxGuests || 2,
            bedType || null,
            bedCount || 1,
            imageURL || null,
            description || null
        ];
        
        // Thêm AvailableRooms nếu có
        const availableRoomsValue = availableRooms !== undefined && availableRooms !== null ? parseInt(availableRooms) : 10;
        sql += `, AvailableRooms`;
        values += `, ?`;
        params.push(availableRoomsValue);
        
        sql += `) ${values})`;
        
        db.query(sql, params, (err, result) => {
            if (err) {
                console.error('Lỗi tạo loại phòng:', err);
                return res.status(500).json({ error: "Lỗi tạo loại phòng: " + err.message });
            }
            res.json({ 
                message: "Tạo loại phòng thành công!",
                roomTypeId: result.insertId
            });
        });
    });
};

exports.updateRoomType = (req, res) => {
    const roomTypeId = req.params.id;
    const { hotelId, roomTypeName, price, area, maxGuests, bedType, bedCount, imageURL, description, availableRooms } = req.body;
    
    // Validate
    if (!roomTypeName || !price) {
        return res.status(400).json({ error: "Vui lòng điền đầy đủ: Tên loại phòng, Giá!" });
    }
    
    if (isNaN(price) || parseFloat(price) <= 0) {
        return res.status(400).json({ error: "Giá phòng phải là số lớn hơn 0!" });
    }
    
    // Kiểm tra RoomType có tồn tại không
    db.query('SELECT RoomTypeID FROM RoomTypes WHERE RoomTypeID = ? AND IsDeleted = 0', [roomTypeId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Lỗi kiểm tra loại phòng: " + err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Loại phòng không tồn tại!" });
        }
        
        // Kiểm tra hotel nếu có thay đổi
        if (hotelId) {
            db.query('SELECT RoomID FROM Rooms WHERE RoomID = ? AND IsDeleted = 0', [hotelId], (err2, hotelResults) => {
                if (err2) {
                    return res.status(500).json({ error: "Lỗi kiểm tra khách sạn: " + err2.message });
                }
                if (hotelResults.length === 0) {
                    return res.status(400).json({ error: "Khách sạn không tồn tại!" });
                }
                
                updateRoomTypeData();
            });
        } else {
            updateRoomTypeData();
        }
        
        function updateRoomTypeData() {
            // Luôn cập nhật AvailableRooms (kể cả khi là 0)
            const availableRoomsValue = availableRooms !== undefined && availableRooms !== null ? parseInt(availableRooms) : 10;
            console.log('📝 Cập nhật AvailableRooms:', availableRoomsValue, 'từ giá trị:', availableRooms);
            
            let sql = `UPDATE RoomTypes 
                         SET HotelID = COALESCE(?, HotelID),
                             RoomTypeName = ?,
                             Price = ?,
                             Area = ?,
                             MaxGuests = ?,
                             BedType = ?,
                             BedCount = ?,
                             ImageURL = ?,
                             Description = ?,
                             AvailableRooms = ?`;
            
            let params = [
                hotelId || null,
                roomTypeName.trim(),
                price,
                area || null,
                maxGuests || 2,
                bedType || null,
                bedCount || 1,
                imageURL || null,
                description || null,
                availableRoomsValue
            ];
            
            sql += ` WHERE RoomTypeID = ? AND IsDeleted = 0`;
            params.push(roomTypeId);
            
            db.query(sql, params, (err, result) => {
                if (err) {
                    console.error('Lỗi cập nhật loại phòng:', err);
                    // Nếu lỗi do cột AvailableRooms chưa tồn tại, thử lại không có cột này
                    if (err.message.includes("Unknown column 'AvailableRooms'")) {
                        // Thử lại không có AvailableRooms
                        let sqlWithoutAvailableRooms = `UPDATE RoomTypes 
                             SET HotelID = COALESCE(?, HotelID),
                                 RoomTypeName = ?,
                                 Price = ?,
                                 Area = ?,
                                 MaxGuests = ?,
                                 BedType = ?,
                                 BedCount = ?,
                                 ImageURL = ?,
                                 Description = ?
                             WHERE RoomTypeID = ? AND IsDeleted = 0`;
                        let paramsWithoutAvailableRooms = [
                            hotelId || null,
                            roomTypeName.trim(),
                            price,
                            area || null,
                            maxGuests || 2,
                            bedType || null,
                            bedCount || 1,
                            imageURL || null,
                            description || null,
                            roomTypeId
                        ];
                        db.query(sqlWithoutAvailableRooms, paramsWithoutAvailableRooms, (err2, result2) => {
                            if (err2) {
                                return res.status(500).json({ error: "Lỗi cập nhật loại phòng: " + err2.message });
                            }
                            return res.json({ 
                                message: "Cập nhật loại phòng thành công! (Lưu ý: Cột AvailableRooms chưa tồn tại. Vui lòng chạy migration 11_add_available_rooms.sql)",
                                roomTypeId: roomTypeId
                            });
                        });
                        return;
                    }
                    return res.status(500).json({ error: "Lỗi cập nhật loại phòng: " + err.message });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: "Không tìm thấy loại phòng để cập nhật!" });
                }
                res.json({ message: "Cập nhật loại phòng thành công!" });
            });
        }
    });
};

exports.deleteRoomType = (req, res) => {
    const roomTypeId = req.params.id;
    
    // Soft delete
    const sql = `UPDATE RoomTypes SET IsDeleted = 1 WHERE RoomTypeID = ?`;
    
    db.query(sql, [roomTypeId], (err, result) => {
        if (err) {
            console.error('Lỗi xóa loại phòng:', err);
            return res.status(500).json({ error: "Lỗi xóa loại phòng: " + err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy loại phòng để xóa!" });
        }
        res.json({ message: "Xóa loại phòng thành công!" });
    });
};

