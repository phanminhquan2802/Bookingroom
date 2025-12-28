const db = require('../config/db');

// Helper function: Validate dates
const validateDates = (checkIn, checkOut) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return { valid: false, error: "Ngày tháng không hợp lệ!" };
    }
    
    if (checkInDate < today) {
        return { valid: false, error: "Ngày check-in không thể là ngày trong quá khứ!" };
    }
    
    if (checkInDate >= checkOutDate) {
        return { valid: false, error: "Ngày check-out phải sau ngày check-in!" };
    }
    
    return { valid: true };
};

// Helper function: Check if room is available
const checkRoomAvailability = (roomId, checkIn, checkOut, callback) => {
    // Kiểm tra phòng tồn tại và available
    db.query(
        `SELECT RoomID, Status FROM Rooms WHERE RoomID = ? AND IsDeleted = 0`,
        [roomId],
        (err, rooms) => {
            if (err) return callback(err, null);
            if (rooms.length === 0) {
                return callback(null, { available: false, error: "Phòng không tồn tại!" });
            }
            
            const room = rooms[0];
            if (room.Status !== 'available') {
                return callback(null, { available: false, error: "Phòng đang bảo trì, không thể đặt!" });
            }
            
            // Kiểm tra phòng có bị trùng với booking khác không
            // Tính cả Pending, Confirmed, CheckedIn
            db.query(
                `SELECT BookingID FROM Bookings 
                 WHERE RoomID = ? 
                 AND Status IN ('Pending', 'Confirmed', 'CheckedIn')
                 AND (
                     (CheckInDate <= ? AND CheckOutDate > ?) OR
                     (CheckInDate < ? AND CheckOutDate >= ?) OR
                     (CheckInDate >= ? AND CheckInDate < ?)
                 )`,
                [roomId, checkOut, checkIn, checkOut, checkIn, checkIn, checkOut],
                (err, bookings) => {
                    if (err) return callback(err, null);
                    if (bookings.length > 0) {
                        return callback(null, { available: false, error: "Phòng đã được đặt trong khoảng thời gian này!" });
                    }
                    return callback(null, { available: true });
                }
            );
        }
    );
};

// Helper function: Validate guests and rooms
const validateGuestsAndRooms = (adults, children, rooms) => {
    const adultsNum = parseInt(adults) || 0;
    const childrenNum = parseInt(children) || 0;
    const roomsNum = parseInt(rooms) || 0;
    
    if (adultsNum < 1) {
        return { valid: false, error: "Số người lớn phải ít nhất là 1!" };
    }
    
    if (adultsNum > 20) {
        return { valid: false, error: "Số người lớn không được vượt quá 20!" };
    }
    
    if (childrenNum < 0) {
        return { valid: false, error: "Số trẻ em không được âm!" };
    }
    
    if (childrenNum > 20) {
        return { valid: false, error: "Số trẻ em không được vượt quá 20!" };
    }
    
    if (roomsNum < 1) {
        return { valid: false, error: "Số phòng phải ít nhất là 1!" };
    }
    
    if (roomsNum > 10) {
        return { valid: false, error: "Số phòng không được vượt quá 10!" };
    }
    
    // Tổng số người không được vượt quá số phòng * 4 (giả sử mỗi phòng tối đa 4 người)
    const totalGuests = adultsNum + childrenNum;
    if (totalGuests > roomsNum * 4) {
        return { valid: false, error: `Tổng số người (${totalGuests}) không được vượt quá ${roomsNum * 4} người cho ${roomsNum} phòng!` };
    }
    
    return { valid: true, adults: adultsNum, children: childrenNum, rooms: roomsNum };
};

// Helper function: Update room availability
const updateRoomAvailability = (roomTypeId, roomsToBook, operation, callback) => {
    if (!roomTypeId) {
        return callback(null, { success: true, skipped: true });
    }
    
    // Kiểm tra xem cột AvailableRooms có tồn tại không
    db.query(
        `SELECT AvailableRooms FROM RoomTypes WHERE RoomTypeID = ? AND IsDeleted = 0`,
        [roomTypeId],
        (err, results) => {
            if (err) {
                // Nếu lỗi do cột không tồn tại, bỏ qua
                if (err.message.includes("Unknown column 'AvailableRooms'")) {
                    return callback(null, { success: true, skipped: true });
                }
                return callback(err, null);
            }
            
            if (results.length === 0) {
                return callback(null, { success: false, error: "Loại phòng không tồn tại!" });
            }
            
            const currentAvailable = results[0].AvailableRooms || 0;
            let newAvailable;
            
            if (operation === 'decrease') {
                if (currentAvailable < roomsToBook) {
                    return callback(null, { 
                        success: false, 
                        error: `Không đủ phòng! Chỉ còn ${currentAvailable} phòng trống.` 
                    });
                }
                newAvailable = currentAvailable - roomsToBook;
            } else if (operation === 'increase') {
                newAvailable = currentAvailable + roomsToBook;
            } else {
                return callback(null, { success: false, error: "Operation không hợp lệ!" });
            }
            
            db.query(
                `UPDATE RoomTypes SET AvailableRooms = ? WHERE RoomTypeID = ?`,
                [newAvailable, roomTypeId],
                (err2) => {
                    if (err2) {
                        return callback(err2, null);
                    }
                    callback(null, { 
                        success: true, 
                        oldAvailable: currentAvailable, 
                        newAvailable: newAvailable 
                    });
                }
            );
        }
    );
};

// Khách đặt phòng
exports.createBooking = (req, res) => {
    const { 
        roomId, roomTypeId, checkIn, checkOut, adults, children, rooms,
        guestName, guestEmail, guestPhone, specialRequests, arrivalTime 
    } = req.body; 
    const userId = req.user.id;
    
    // 1. Kiểm tra thông tin đầu vào bắt buộc
    if (!roomId || !checkIn || !checkOut) {
        return res.status(400).json({ error: "Thiếu thông tin! Vui lòng cung cấp roomId, checkIn, checkOut" });
    }
    
    // 2. Validate ngày tháng
    const dateValidation = validateDates(checkIn, checkOut);
    if (!dateValidation.valid) {
        return res.status(400).json({ error: dateValidation.error });
    }
    
    // 3. Validate số người và phòng
    const guestsValidation = validateGuestsAndRooms(adults, children, rooms);
    if (!guestsValidation.valid) {
        return res.status(400).json({ error: guestsValidation.error });
    }
    
    // 4. Kiểm tra và giảm số lượng phòng nếu có roomTypeId
    if (roomTypeId) {
        updateRoomAvailability(roomTypeId, guestsValidation.rooms, 'decrease', (err, availabilityResult) => {
            if (err) {
                console.error('Lỗi kiểm tra số lượng phòng:', err);
                return res.status(500).json({ error: "Lỗi kiểm tra số lượng phòng" });
            }
            
            if (!availabilityResult.success) {
                if (!availabilityResult.skipped) {
                    return res.status(400).json({ error: availabilityResult.error });
                }
            }
            
            proceedWithBooking();
        });
    } else {
        // Nếu không có roomTypeId, chỉ kiểm tra phòng có sẵn không (logic cũ)
        checkRoomAvailability(roomId, checkIn, checkOut, (err, availability) => {
            if (err) {
                console.error('Lỗi kiểm tra phòng:', err);
                return res.status(500).json({ error: "Lỗi kiểm tra phòng" });
            }
            
            if (!availability.available) {
                return res.status(400).json({ error: availability.error });
            }
            
            proceedWithBooking();
        });
    }
    
    function proceedWithBooking() {
        // 5. Tạo booking với thông tin người và phòng
        // Thử insert với các cột bổ sung nếu có
        let insertColumns = 'AccountID, RoomID, Status, CheckInDate, CheckOutDate, Adults, Children, Rooms';
        let insertValues = '?, ?, ?, ?, ?, ?, ?, ?';
        let insertParams = [userId, roomId, 'Pending', checkIn, checkOut, guestsValidation.adults, guestsValidation.children, guestsValidation.rooms];
        
        // Thêm các cột bổ sung nếu có trong request
        if (guestName || guestEmail || guestPhone || specialRequests || arrivalTime) {
            // Kiểm tra xem các cột có tồn tại không bằng cách thử insert với các cột này
            insertColumns += ', GuestName, GuestEmail, GuestPhone, SpecialRequests, ArrivalTime';
            insertValues += ', ?, ?, ?, ?, ?';
            insertParams.push(
                guestName || null,
                guestEmail || null,
                guestPhone || null,
                specialRequests || null,
                arrivalTime || null
            );
        }
        
        // Thêm RoomTypeID nếu có (thử insert, nếu cột không tồn tại thì bỏ qua)
        if (roomTypeId) {
            try {
                insertColumns += ', RoomTypeID';
                insertValues += ', ?';
                insertParams.push(roomTypeId);
            } catch (e) {
                // Bỏ qua nếu không thể thêm
            }
        }
        
        db.query(
            `INSERT INTO Bookings (${insertColumns}) VALUES (${insertValues})`,
            insertParams,
            (err, result) => {
                if (err) {
                    console.error('Lỗi tạo booking:', err);
                    
                    // Nếu lỗi khi tạo booking, cần tăng lại số lượng phòng đã giảm
                    if (roomTypeId) {
                        updateRoomAvailability(roomTypeId, guestsValidation.rooms, 'increase', (rollbackErr) => {
                            if (rollbackErr) {
                                console.error('Lỗi rollback số lượng phòng:', rollbackErr);
                            }
                        });
                    }
                    // Nếu lỗi do thiếu cột, thử lại không có các cột bổ sung
                    if (err.message.includes("Unknown column 'GuestName'") || 
                        err.message.includes("Unknown column 'GuestEmail'") ||
                        err.message.includes("Unknown column 'GuestPhone'") ||
                        err.message.includes("Unknown column 'SpecialRequests'") ||
                        err.message.includes("Unknown column 'ArrivalTime'") ||
                        err.message.includes("Unknown column 'RoomTypeID'")) {
                        // Thử lại với các cột cơ bản
                        db.query(
                            `INSERT INTO Bookings (AccountID, RoomID, Status, CheckInDate, CheckOutDate, Adults, Children, Rooms) 
                             VALUES (?, ?, 'Pending', ?, ?, ?, ?, ?)`,
                            [userId, roomId, checkIn, checkOut, guestsValidation.adults, guestsValidation.children, guestsValidation.rooms],
                            (err2, result2) => {
                                if (err2) {
                                    // Nếu lỗi do thiếu cột Adults, Children, Rooms
                                    if (err2.message.includes("Unknown column 'Adults'")) {
                                        return res.status(500).json({ 
                                            error: "Database chưa được cập nhật! Vui lòng chạy file migration: migrations/add_guests_rooms_to_bookings.sql" 
                                        });
                                    }
                                    return res.status(500).json({ error: "Lỗi đặt phòng: " + err2.message });
                                }
                                res.json({ 
                                    message: "Đặt phòng thành công!",
                                    bookingId: result2.insertId,
                                    guests: {
                                        adults: guestsValidation.adults,
                                        children: guestsValidation.children,
                                        rooms: guestsValidation.rooms
                                    },
                                    note: "Thông tin bổ sung chưa được lưu. Vui lòng chạy migration để thêm các cột GuestName, GuestEmail, GuestPhone, SpecialRequests, ArrivalTime vào bảng Bookings."
                                });
                            }
                        );
                        return;
                    }
                    // Nếu lỗi do thiếu cột Adults, Children, Rooms
                    if (err.message.includes("Unknown column 'Adults'")) {
                        return res.status(500).json({ 
                            error: "Database chưa được cập nhật! Vui lòng chạy file migration: migrations/add_guests_rooms_to_bookings.sql" 
                        });
                    }
                    return res.status(500).json({ error: "Lỗi đặt phòng: " + err.message });
                }
                res.json({ 
                    message: "Đặt phòng thành công!",
                    bookingId: result.insertId,
                    guests: {
                        adults: guestsValidation.adults,
                        children: guestsValidation.children,
                        rooms: guestsValidation.rooms
                    }
                });
            }
        );
    }
};

// Customer hủy booking của chính họ
exports.cancelBooking = (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id; // Lấy từ token
    const { cancelReason } = req.body; // Lý do hủy đơn (tùy chọn)
    
    // 1. Lấy thông tin booking và kiểm tra quyền sở hữu
    db.query(
        `SELECT Status, CheckInDate, CheckOutDate, RoomTypeID, Rooms, AccountID 
         FROM Bookings WHERE BookingID = ?`,
        [bookingId],
        (err, results) => {
            if (err) {
                console.error('Lỗi lấy booking:', err);
                return res.status(500).json({ error: "Lỗi lấy thông tin đặt phòng" });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: "Không tìm thấy đơn đặt phòng!" });
            }
            
            const booking = results[0];
            
            // 2. Kiểm tra booking thuộc về user hiện tại
            if (booking.AccountID !== userId) {
                return res.status(403).json({ error: "Bạn không có quyền hủy đơn đặt phòng này!" });
            }
            
            // 3. Kiểm tra status có thể hủy (Pending hoặc Confirmed)
            if (booking.Status !== 'Pending' && booking.Status !== 'Confirmed') {
                return res.status(400).json({ 
                    error: `Không thể hủy đơn với trạng thái hiện tại: ${booking.Status}. Chỉ có thể hủy đơn đang "Chờ duyệt" hoặc "Đã xác nhận".` 
                });
            }
            
            // 4. Kiểm tra chưa đến ngày check-in
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const checkInDate = new Date(booking.CheckInDate);
            checkInDate.setHours(0, 0, 0, 0);
            
            if (checkInDate <= today) {
                return res.status(400).json({ 
                    error: "Không thể hủy đơn sau ngày check-in hoặc trong ngày check-in!" 
                });
            }
            
            // 5. Xử lý cập nhật số lượng phòng (tăng lại vì hủy)
            const roomTypeId = booking.RoomTypeID;
            const roomsCount = booking.Rooms || 1;
            
            if (roomTypeId) {
                updateRoomAvailability(roomTypeId, roomsCount, 'increase', (err, availabilityResult) => {
                    if (err) {
                        console.error('Lỗi cập nhật số lượng phòng:', err);
                        if (err.message && err.message.includes("Unknown column 'AvailableRooms'")) {
                            proceedWithCancellation();
                        } else {
                            return res.status(500).json({ error: "Lỗi cập nhật số lượng phòng" });
                        }
                    } else if (!availabilityResult.success && !availabilityResult.skipped) {
                        return res.status(400).json({ error: availabilityResult.error });
                    } else {
                        proceedWithCancellation();
                    }
                });
            } else {
                proceedWithCancellation();
            }
            
            function proceedWithCancellation() {
                // 6. Cập nhật trạng thái sang Cancelled và lưu lý do hủy (nếu có)
                let updateSql = "UPDATE Bookings SET Status = 'Cancelled'";
                let updateParams = [];
                
                // Thêm CancelReason nếu có
                if (cancelReason) {
                    // Kiểm tra xem cột CancelReason có tồn tại không
                    updateSql += ", CancelReason = ?";
                    updateParams.push(cancelReason);
                }
                
                updateSql += " WHERE BookingID = ?";
                updateParams.push(bookingId);
                
                db.query(updateSql, updateParams, (err) => {
                        if (err) {
                            console.error('Lỗi hủy booking:', err);
                            // Rollback số lượng phòng nếu lỗi
                            if (roomTypeId) {
                                updateRoomAvailability(roomTypeId, roomsCount, 'decrease', (rollbackErr) => {
                                    if (rollbackErr) {
                                        console.error('Lỗi rollback số lượng phòng:', rollbackErr);
                                    }
                                });
                            }
                            return res.status(500).json({ error: "Lỗi hủy đơn đặt phòng" });
                        }
                        res.json({ 
                            message: "Hủy đơn đặt phòng thành công!",
                            bookingId: bookingId,
                            oldStatus: booking.Status,
                            newStatus: 'Cancelled'
                        });
                    }
                );
            }
        }
    );
};

// Khách xem lịch sử
exports.getMyBookings = (req, res) => {
    const sql = `
        SELECT B.*, R.RoomName, R.Price, R.ImageURL, Rv.ReviewID AS IsReviewed,
               IFNULL(B.Adults, 2) AS Adults,
               IFNULL(B.Children, 0) AS Children,
               IFNULL(B.Rooms, 1) AS Rooms,
               B.CancelReason,
               RT.RoomTypeName, RT.RoomTypeID, RT.Price AS RoomTypePrice
        FROM Bookings B 
        JOIN Rooms R ON B.RoomID = R.RoomID 
        LEFT JOIN Reviews Rv ON B.BookingID = Rv.BookingID
        LEFT JOIN RoomTypes RT ON B.RoomTypeID = RT.RoomTypeID
        WHERE B.AccountID = ? ORDER BY B.BookingDate DESC
    `;
    db.query(sql, [req.user.id], (err, result) => {
        if(err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
};

// Admin lấy danh sách
exports.getAllBookings = (req, res) => {
    const sql = `
        SELECT B.BookingID, B.CheckInDate, B.CheckOutDate, B.Status, B.BookingDate,
               IFNULL(B.Adults, 2) AS Adults,
               IFNULL(B.Children, 0) AS Children,
               IFNULL(B.Rooms, 1) AS Rooms,
               B.GuestName, B.GuestEmail, B.GuestPhone, B.SpecialRequests, B.ArrivalTime,
               B.CancelReason,
               A.Username, A.Email, R.RoomName, R.Price, R.ImageURL
        FROM Bookings B
        JOIN Accounts A ON B.AccountID = A.AccountID
        JOIN Rooms R ON B.RoomID = R.RoomID
        ORDER BY B.BookingDate DESC
    `;
    db.query(sql, (err, results) => {
        if(err) {
            console.error('Lỗi lấy đơn hàng:', err);
            return res.status(500).json({ error: "Lỗi lấy đơn hàng: " + err.message });
        }
        res.json(results);
    });
};

// Helper function: Validate status transition
const validateStatusTransition = (currentStatus, newStatus, checkInDate, checkOutDate) => {
    // Cho phép quay lại trạng thái trước để admin có thể sửa lỗi
    const validTransitions = {
        'Pending': ['Confirmed', 'Cancelled'],
        'Confirmed': ['CheckedIn', 'Pending', 'Cancelled'], // Cho phép quay lại Pending
        'CheckedIn': ['CheckedOut', 'Confirmed'], // Cho phép quay lại Confirmed nếu bấm nhầm
        'CheckedOut': [], // Không thể chuyển từ CheckedOut (đã hoàn tất)
        'Cancelled': [] // Không thể chuyển từ Cancelled
    };
    
    if (!validTransitions[currentStatus]) {
        return { valid: false, error: `Trạng thái hiện tại không hợp lệ: ${currentStatus}` };
    }
    
    if (!validTransitions[currentStatus].includes(newStatus)) {
        return { 
            valid: false, 
            error: `Không thể chuyển từ ${currentStatus} sang ${newStatus}. Chỉ có thể chuyển sang: ${validTransitions[currentStatus].join(', ')}` 
        };
    }
    
    // Kiểm tra điều kiện ngày tháng (chỉ áp dụng khi chuyển tiến, không áp dụng khi quay lại)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkIn = new Date(checkInDate);
    checkIn.setHours(0, 0, 0, 0);
    
    const checkOut = new Date(checkOutDate);
    checkOut.setHours(0, 0, 0, 0);
    
    // Chỉ validate ngày khi chuyển tiến (không validate khi quay lại)
    const isForwardTransition = 
        (currentStatus === 'Pending' && newStatus === 'Confirmed') ||
        (currentStatus === 'Confirmed' && newStatus === 'CheckedIn') ||
        (currentStatus === 'CheckedIn' && newStatus === 'CheckedOut');
    
    if (isForwardTransition) {
        if (newStatus === 'CheckedIn' && checkIn > today) {
            return { valid: false, error: "Chỉ có thể check-in khi ngày check-in đã đến hoặc đã qua!" };
        }
        
        if (newStatus === 'CheckedOut' && checkOut > today) {
            return { valid: false, error: "Chỉ có thể check-out khi ngày check-out đã đến hoặc đã qua!" };
        }
        
        if (newStatus === 'CheckedOut' && currentStatus !== 'CheckedIn') {
            return { valid: false, error: "Chỉ có thể check-out khi đã check-in!" };
        }
    }
    
    return { valid: true };
};

// Admin cập nhật trạng thái
exports.updateBookingStatus = (req, res) => {
    const { status } = req.body;
    const bookingId = req.params.id;
    
    // 1. Kiểm tra thông tin đầu vào
    if (!status) {
        return res.status(400).json({ error: "Thiếu trạng thái mới!" });
    }
    
    const validStatuses = ['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Trạng thái không hợp lệ! Chỉ chấp nhận: ${validStatuses.join(', ')}` });
    }
    
    // 2. Lấy thông tin booking hiện tại
    db.query(
        `SELECT Status, CheckInDate, CheckOutDate, RoomTypeID, Rooms FROM Bookings WHERE BookingID = ?`,
        [bookingId],
        (err, results) => {
            if (err) {
                console.error('Lỗi lấy booking:', err);
                return res.status(500).json({ error: "Lỗi lấy thông tin đặt phòng" });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: "Không tìm thấy đơn đặt phòng!" });
            }
            
            const booking = results[0];
            const currentStatus = booking.Status;
            const roomTypeId = booking.RoomTypeID;
            const roomsCount = booking.Rooms || 1;
            
            // 3. Nếu trạng thái không đổi, không cần làm gì
            if (currentStatus === status) {
                return res.json({ message: "Trạng thái không thay đổi!" });
            }
            
            // 4. Validate chuyển trạng thái
            const validation = validateStatusTransition(
                currentStatus, 
                status, 
                booking.CheckInDate, 
                booking.CheckOutDate
            );
            
            if (!validation.valid) {
                console.error(`❌ Chuyển trạng thái không hợp lệ: ${currentStatus} -> ${status}`);
                console.error(`   Lỗi: ${validation.error}`);
                return res.status(400).json({ error: validation.error });
            }
            
            console.log(`✅ Chuyển trạng thái hợp lệ: ${currentStatus} -> ${status}`);
            
            // 5. Xử lý cập nhật số lượng phòng
            // Các trạng thái "giải phóng" phòng: Cancelled, CheckedOut
            // Các trạng thái "chiếm" phòng: Pending, Confirmed, CheckedIn
            const statusesThatOccupyRooms = ['Pending', 'Confirmed', 'CheckedIn'];
            const statusesThatFreeRooms = ['Cancelled', 'CheckedOut'];
            
            const wasOccupying = statusesThatOccupyRooms.includes(currentStatus);
            const willOccupy = statusesThatOccupyRooms.includes(status);
            const willFree = statusesThatFreeRooms.includes(status);
            const wasFreed = statusesThatFreeRooms.includes(currentStatus);
            
            // Nếu chuyển từ trạng thái "chiếm" sang "giải phóng" -> tăng số lượng phòng
            // Nếu chuyển từ trạng thái "giải phóng" sang "chiếm" -> giảm số lượng phòng
            let availabilityOperation = null;
            if (wasOccupying && willFree) {
                availabilityOperation = 'increase';
            } else if (wasFreed && willOccupy) {
                availabilityOperation = 'decrease';
            }
            
            // 6. Cập nhật số lượng phòng nếu cần
            if (availabilityOperation && roomTypeId) {
                updateRoomAvailability(roomTypeId, roomsCount, availabilityOperation, (err, availabilityResult) => {
                    if (err) {
                        console.error('Lỗi cập nhật số lượng phòng:', err);
                        if (err.message && err.message.includes("Unknown column 'AvailableRooms'")) {
                            proceedWithStatusUpdate();
                        } else {
                            return res.status(500).json({ error: "Lỗi cập nhật số lượng phòng" });
                        }
                    } else if (!availabilityResult.success && !availabilityResult.skipped) {
                        return res.status(400).json({ error: availabilityResult.error });
                    } else {
                        proceedWithStatusUpdate();
                    }
                });
            } else {
                proceedWithStatusUpdate();
            }
            
            function proceedWithStatusUpdate() {
                // 7. Cập nhật trạng thái
                db.query(
                    "UPDATE Bookings SET Status = ? WHERE BookingID = ?",
                    [status, bookingId],
                    (err) => {
                        if (err) {
                            console.error('Lỗi cập nhật trạng thái:', err);
                            // Rollback số lượng phòng nếu lỗi
                            if (availabilityOperation && roomTypeId) {
                                const rollbackOperation = availabilityOperation === 'increase' ? 'decrease' : 'increase';
                                updateRoomAvailability(roomTypeId, roomsCount, rollbackOperation, (rollbackErr) => {
                                    if (rollbackErr) {
                                        console.error('Lỗi rollback số lượng phòng:', rollbackErr);
                                    }
                                });
                            }
                            return res.status(500).json({ error: "Lỗi cập nhật trạng thái" });
                        }
                        res.json({ 
                            message: `Cập nhật trạng thái thành công từ ${currentStatus} sang ${status}!`,
                            oldStatus: currentStatus,
                            newStatus: status
                        });
                    }
                );
            }
        }
    );
};