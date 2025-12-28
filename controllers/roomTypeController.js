const db = require('../config/db');

// --- PUBLIC: LẤY CÁC LOẠI PHÒNG THEO HOTEL ---
exports.getRoomTypesByHotel = (req, res) => {
    const hotelId = req.params.hotelId;
    
    const sql = `
        SELECT RT.*, 
               COUNT(DISTINCT RA.AmenityID) as AmenityCount
        FROM RoomTypes RT
        LEFT JOIN RoomAmenities RA ON RT.RoomTypeID = RA.RoomTypeID
        WHERE RT.HotelID = ? AND RT.IsDeleted = 0
        GROUP BY RT.RoomTypeID
        ORDER BY RT.Price ASC
    `;
    
    db.query(sql, [hotelId], (err, results) => {
        if (err) {
            console.error('Lỗi lấy loại phòng:', err);
            
            // Nếu bảng chưa tồn tại, trả về mảng rỗng thay vì lỗi
            if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes("doesn't exist")) {
                console.log('Bảng RoomTypes chưa được tạo. Vui lòng chạy migration.');
                return res.json([]);
            }
            
            return res.status(500).json({ 
                error: 'Lỗi lấy loại phòng: ' + err.message
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
    const { checkIn, checkOut, hotelId } = req.query;
    
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
    
    let sql = `
        SELECT RT.*,
               R.RoomName as HotelName,
               COUNT(DISTINCT RA.AmenityID) as AmenityCount
        FROM RoomTypes RT
        JOIN Rooms R ON RT.HotelID = R.RoomID
        LEFT JOIN RoomAmenities RA ON RT.RoomTypeID = RA.RoomTypeID
        WHERE RT.IsDeleted = 0
        AND RT.RoomTypeID NOT IN (
            SELECT DISTINCT B.RoomTypeID 
            FROM Bookings B
            WHERE B.Status IN ('Pending', 'Confirmed', 'CheckedIn')
            AND B.CheckInDate < ?
            AND B.CheckOutDate > ?
        )
    `;
    
    const params = [checkOut, checkIn];
    
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
        SELECT RT.*, R.RoomName as HotelName
        FROM RoomTypes RT
        JOIN Rooms R ON RT.HotelID = R.RoomID
        WHERE RT.IsDeleted = 0
        ORDER BY RT.HotelID, RT.RoomTypeID
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Lỗi lấy loại phòng:', err);
            return res.status(500).json({ error: 'Lỗi lấy loại phòng: ' + err.message });
        }
        res.json(results);
    });
};

exports.createRoomType = (req, res) => {
    const { hotelId, roomTypeName, price, area, maxGuests, bedType, bedCount, imageURL, description } = req.body;
    
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
        const sql = `INSERT INTO RoomTypes (HotelID, RoomTypeName, Price, Area, MaxGuests, BedType, BedCount, ImageURL, Description) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(sql, [
            hotelId,
            roomTypeName.trim(),
            price,
            area || null,
            maxGuests || 2,
            bedType || null,
            bedCount || 1,
            imageURL || null,
            description || null
        ], (err, result) => {
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
    const { hotelId, roomTypeName, price, area, maxGuests, bedType, bedCount, imageURL, description } = req.body;
    
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
            const sql = `UPDATE RoomTypes 
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
            
            db.query(sql, [
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
            ], (err, result) => {
                if (err) {
                    console.error('Lỗi cập nhật loại phòng:', err);
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

