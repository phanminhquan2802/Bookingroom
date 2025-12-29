const db = require('../config/db');

// --- PUBLIC: TÌM KIẾM ---
exports.searchRooms = (req, res) => {
    const { location, checkIn, checkOut, categoryId, adults, children, rooms } = req.query;
    const defaultCheckIn = new Date().toISOString().slice(0, 10);
    const defaultCheckOut = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const checkInDate = checkIn || defaultCheckIn;
    const checkOutDate = checkOut || defaultCheckOut;
    
    // Parse số người và phòng (mặc định nếu không có)
    const adultsNum = parseInt(adults) || 2;
    const childrenNum = parseInt(children) || 0;
    const roomsNum = parseInt(rooms) || 1;

    // Validate dates
    const checkInObj = new Date(checkInDate);
    const checkOutObj = new Date(checkOutDate);
    
    if (isNaN(checkInObj.getTime()) || isNaN(checkOutObj.getTime())) {
        return res.status(400).json({ error: "Ngày tháng không hợp lệ!" });
    }
    
    if (checkInObj >= checkOutObj) {
        return res.status(400).json({ error: "Ngày check-out phải sau ngày check-in!" });
    }

    // Chỉ hiển thị hotels có room types phù hợp với yêu cầu
    // Filter dựa trên: có ít nhất 1 RoomType thỏa mãn:
    // - AvailableRooms >= roomsNum (hoặc ActualAvailableRooms >= roomsNum nếu có checkIn/checkOut)
    // - (MaxGuests * roomsNum) >= totalGuests
    let sql = `
        SELECT R.*, C.CategoryName,
               COUNT(DISTINCT Rv.ReviewID) as ReviewCount, 
               IFNULL(AVG(Rv.Rating), 0) as AvgRating
        FROM Rooms R
        LEFT JOIN Categories C ON R.CategoryID = C.CategoryID
        LEFT JOIN Reviews Rv ON R.RoomID = Rv.RoomID
        WHERE R.Status = 'available'
        AND R.IsDeleted = 0
    `;
    const params = [];
    
    if (location) { 
        sql += " AND R.Address LIKE ?"; 
        params.push(`%${location}%`); 
    }
    if (categoryId) {
        sql += " AND R.CategoryID = ?";
        params.push(categoryId);
    }
    
    // Thêm điều kiện: hotel phải có ít nhất 1 RoomType phù hợp
    if (roomsNum > 0 && (adultsNum > 0 || childrenNum > 0)) {
        // Tính tổng số người: 2 trẻ em = 1 người lớn
        const totalGuests = adultsNum + Math.ceil(childrenNum / 2);
        
        if (checkInDate && checkOutDate) {
            // Có checkIn/checkOut: kiểm tra ActualAvailableRooms
            sql += ` AND EXISTS (
                SELECT 1 FROM RoomTypes RT
                WHERE RT.HotelID = R.RoomID
                AND RT.IsDeleted = 0
                AND (IFNULL(RT.MaxGuests, 2) * ?) >= ?
                AND (
                    (IFNULL(RT.AvailableRooms, 0) + COALESCE(
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
                    )
                ) >= ?
            )`;
            params.push(roomsNum, totalGuests, checkOutDate, checkInDate, roomsNum);
        } else {
            // Không có checkIn/checkOut: chỉ kiểm tra AvailableRooms
            sql += ` AND EXISTS (
                SELECT 1 FROM RoomTypes RT
                WHERE RT.HotelID = R.RoomID
                AND RT.IsDeleted = 0
                AND IFNULL(RT.AvailableRooms, 0) >= ?
                AND (IFNULL(RT.MaxGuests, 2) * ?) >= ?
            )`;
            params.push(roomsNum, roomsNum, totalGuests);
        }
    }
    
    sql += " GROUP BY R.RoomID";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Lỗi tìm kiếm phòng:', err);
            return res.status(500).json({ error: "Lỗi tìm kiếm phòng: " + err.message });
        }
        res.json(results);
    });
};

// --- PUBLIC: LẤY CHI TIẾT PHÒNG ---
exports.getRoomDetail = (req, res) => {
    const roomId = req.params.id;
    
    const sql = `
        SELECT R.*, C.CategoryName,
               COUNT(DISTINCT Rv.ReviewID) as ReviewCount, 
               IFNULL(AVG(Rv.Rating), 0) as AvgRating
        FROM Rooms R
        LEFT JOIN Categories C ON R.CategoryID = C.CategoryID
        LEFT JOIN Reviews Rv ON R.RoomID = Rv.RoomID
        WHERE R.RoomID = ? AND R.IsDeleted = 0
        GROUP BY R.RoomID
    `;
    
    db.query(sql, [roomId], (err, results) => {
        if (err) {
            console.error('Lỗi lấy chi tiết phòng:', err);
            return res.status(500).json({ error: "Lỗi lấy chi tiết phòng: " + err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy phòng!" });
        }
        
        res.json(results[0]);
    });
};

// --- PUBLIC: LẤY PHÒNG TRỐNG TRONG KHOẢNG THỜI GIAN ---
exports.getAvailableRooms = (req, res) => {
    const { checkIn, checkOut, roomId } = req.query;
    
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
    
    // Luôn hiển thị hotel (không filter dựa trên booking)
    let sql = `
        SELECT R.*, C.CategoryName,
               COUNT(DISTINCT Rv.ReviewID) as ReviewCount, 
               IFNULL(AVG(Rv.Rating), 0) as AvgRating
        FROM Rooms R
        LEFT JOIN Categories C ON R.CategoryID = C.CategoryID
        LEFT JOIN Reviews Rv ON R.RoomID = Rv.RoomID
        WHERE R.Status = 'available'
        AND R.IsDeleted = 0
    `;
    
    const params = [];
    
    if (roomId) {
        sql += " AND R.RoomID = ?";
        params.push(roomId);
    }
    
    sql += " GROUP BY R.RoomID";
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Lỗi lấy phòng trống:', err);
            return res.status(500).json({ error: "Lỗi lấy phòng trống: " + err.message });
        }
        res.json(results);
    });
};

// --- ADMIN: CRUD ---
exports.getAllRoomsAdmin = (req, res) => {
    // Lấy hết thông tin (bao gồm cả Lat/Lng vì dùng Rooms.*)
    const sql = `
        SELECT Rooms.*, Categories.CategoryName 
        FROM Rooms 
        LEFT JOIN Categories ON Rooms.CategoryID = Categories.CategoryID
        WHERE Rooms.IsDeleted = 0
    `;
    db.query(sql, (err, results) => {
        if(err) return res.status(500).json({ error: "Lỗi lấy phòng" });
        res.json(results);
    });
};

exports.createRoom = (req, res) => {
    const { name, category_id, price, status, description, image, address, lat, lng } = req.body;

    // 1. Validate thông tin bắt buộc
    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Tên phòng không được để trống!" });
    }
    
    // Cho phép price = 0 cho khách sạn (giá thực tế nằm ở RoomTypes)
    // Chuyển đổi price sang number và kiểm tra
    const priceNum = price !== undefined && price !== null ? parseFloat(price) : 0;
    if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ error: "Giá phòng phải là số >= 0!" });
    }
    
    if (status && !['available', 'maintenance'].includes(status)) {
        return res.status(400).json({ error: "Trạng thái không hợp lệ! Chỉ chấp nhận: available, maintenance" });
    }
    
    // 2. Validate lat/lng nếu có
    const latVal = (lat && lat !== "") ? parseFloat(lat) : null;
    const lngVal = (lng && lng !== "") ? parseFloat(lng) : null;
    
    if (latVal !== null && (isNaN(latVal) || latVal < -90 || latVal > 90)) {
        return res.status(400).json({ error: "Latitude không hợp lệ! Phải từ -90 đến 90" });
    }
    
    if (lngVal !== null && (isNaN(lngVal) || lngVal < -180 || lngVal > 180)) {
        return res.status(400).json({ error: "Longitude không hợp lệ! Phải từ -180 đến 180" });
    }

    // 3. Insert vào database
    const sql = `INSERT INTO Rooms (RoomName, CategoryID, Price, Status, Description, ImageURL, Address, Latitude, Longitude) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, 
    [name.trim(), category_id || null, priceNum, status || 'available', description || null, image || null, address || null, latVal, lngVal], 
    (err, result) => {
        if(err) {
            console.error("Lỗi SQL:", err);
            return res.status(500).json({ error: "Lỗi thêm phòng: " + err.message });
        }
        res.json({ 
            message: "Thêm phòng thành công!",
            roomId: result.insertId
        });
    });
};

exports.updateRoom = (req, res) => {
    const { name, category_id, price, status, description, image, address, lat, lng } = req.body;
    const roomId = req.params.id;

    // 1. Kiểm tra phòng tồn tại
    db.query("SELECT RoomID FROM Rooms WHERE RoomID = ? AND IsDeleted = 0", [roomId], (err, rooms) => {
        if (err) {
            console.error("Lỗi kiểm tra phòng:", err);
            return res.status(500).json({ error: "Lỗi kiểm tra phòng" });
        }
        
        if (rooms.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy phòng!" });
        }
        
        // 2. Validate thông tin
        if (name !== undefined && (!name || !name.trim())) {
            return res.status(400).json({ error: "Tên phòng không được để trống!" });
        }
        
        if (price !== undefined) {
            const priceNum = parseFloat(price);
            if (isNaN(priceNum) || priceNum < 0) {
                return res.status(400).json({ error: "Giá phòng phải là số >= 0!" });
            }
        }
        
        if (status !== undefined && !['available', 'maintenance'].includes(status)) {
            return res.status(400).json({ error: "Trạng thái không hợp lệ! Chỉ chấp nhận: available, maintenance" });
        }
        
        // 3. Validate lat/lng nếu có
        const latVal = (lat !== undefined && lat !== null && lat !== "") ? parseFloat(lat) : null;
        const lngVal = (lng !== undefined && lng !== null && lng !== "") ? parseFloat(lng) : null;
        
        if (latVal !== null && (isNaN(latVal) || latVal < -90 || latVal > 90)) {
            return res.status(400).json({ error: "Latitude không hợp lệ! Phải từ -90 đến 90" });
        }
        
        if (lngVal !== null && (isNaN(lngVal) || lngVal < -180 || lngVal > 180)) {
            return res.status(400).json({ error: "Longitude không hợp lệ! Phải từ -180 đến 180" });
        }

        // 4. Cập nhật phòng
        const sql = `UPDATE Rooms 
                     SET RoomName=?, CategoryID=?, Price=?, Status=?, Description=?, ImageURL=?, Address=?, Latitude=?, Longitude=? 
                     WHERE RoomID=?`;

        // Xử lý price: nếu undefined thì giữ nguyên giá trị cũ, nếu có thì parse
        const priceToUpdate = price !== undefined ? parseFloat(price) : undefined;
        
        db.query(sql, 
        [
            name !== undefined ? name.trim() : null,
            category_id !== undefined ? category_id : null,
            priceToUpdate !== undefined ? priceToUpdate : null,
            status !== undefined ? status : null,
            description !== undefined ? description : null,
            image !== undefined ? image : null,
            address !== undefined ? address : null,
            latVal,
            lngVal,
            roomId
        ], 
        (err) => {
            if(err) {
                console.error("Lỗi SQL:", err);
                return res.status(500).json({ error: "Lỗi cập nhật phòng: " + err.message });
            }
            res.json({ message: "Cập nhật phòng thành công!" });
        });
    });
};

exports.deleteRoom = (req, res) => {
    const sql = "UPDATE Rooms SET IsDeleted = 1 WHERE RoomID = ?";
    
    db.query(sql, [req.params.id], (err) => {
        if(err) return res.status(500).json({ error: "Lỗi xóa phòng" });
        res.json({ message: "Đã xóa phòng thành công!" });
    });
};