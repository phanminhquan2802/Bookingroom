const db = require('../config/db');

// Helper: Kiểm tra nhân viên có được phân công quản lý khách sạn này không
const checkStaffHotelAccess = (staffId, hotelId, callback) => {
    db.query(
        `SELECT SH.StaffHotelID 
         FROM StaffHotels SH
         WHERE SH.StaffID = ? 
         AND SH.HotelID = ? 
         AND SH.IsActive = 1`,
        [staffId, hotelId],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results.length > 0);
        }
    );
};

// Helper: Lấy danh sách khách sạn được phân công cho nhân viên
const getAssignedHotels = (staffId, callback) => {
    db.query(
        `SELECT R.RoomID as HotelID, R.RoomName as HotelName, R.Address, R.ImageURL
         FROM StaffHotels SH
         JOIN Rooms R ON SH.HotelID = R.RoomID
         WHERE SH.StaffID = ? 
         AND SH.IsActive = 1
         AND (R.IsDeleted = 0 OR R.IsDeleted IS NULL)`,
        [staffId],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        }
    );
};

// 1. Lấy danh sách khách sạn được phân công cho nhân viên
exports.getMyHotels = (req, res) => {
    const staffId = req.user.id;
    
    getAssignedHotels(staffId, (err, hotels) => {
        if (err) {
            console.error('Lỗi lấy danh sách khách sạn:', err);
            return res.status(500).json({ error: "Lỗi lấy danh sách khách sạn" });
        }
        res.json(hotels);
    });
};

// 2. Lấy danh sách booking của một khách sạn (chỉ booking của khách sạn được phân công)
exports.getBookingsByHotel = (req, res) => {
    const staffId = req.user.id;
    const hotelId = req.params.hotelId;
    const { status, checkIn, checkOut } = req.query;
    
    // Kiểm tra nhân viên có quyền quản lý khách sạn này không
    checkStaffHotelAccess(staffId, hotelId, (err, hasAccess) => {
        if (err) {
            console.error('Lỗi kiểm tra quyền:', err);
            return res.status(500).json({ error: "Lỗi kiểm tra quyền truy cập" });
        }
        
        if (!hasAccess) {
            return res.status(403).json({ error: "Bạn không có quyền quản lý khách sạn này!" });
        }
        
        // Xây dựng query
        let sql = `
            SELECT B.*, 
                   A.Username, A.Email,
                   R.RoomName, R.Address,
                   RT.RoomTypeName, RT.Price as RoomTypePrice,
                   C.CategoryName,
                   IFNULL(B.CheckInConfirmed, 0) AS CheckInConfirmed,
                   IFNULL(B.CheckOutConfirmed, 0) AS CheckOutConfirmed,
                   B.RoomInspection
            FROM Bookings B
            JOIN Accounts A ON B.AccountID = A.AccountID
            JOIN Rooms R ON B.RoomID = R.RoomID
            LEFT JOIN RoomTypes RT ON B.RoomTypeID = RT.RoomTypeID
            LEFT JOIN Categories C ON R.CategoryID = C.CategoryID
            WHERE B.RoomID = ?
        `;
        const params = [hotelId];
        
        // Filter theo status
        if (status && status !== 'all') {
            sql += ` AND B.Status = ?`;
            params.push(status);
        }
        
        // Filter theo check-in date
        if (checkIn) {
            sql += ` AND DATE(B.CheckInDate) >= ?`;
            params.push(checkIn);
        }
        
        // Filter theo check-out date
        if (checkOut) {
            sql += ` AND DATE(B.CheckOutDate) <= ?`;
            params.push(checkOut);
        }
        
        sql += ` ORDER BY B.CheckInDate DESC, B.BookingID DESC`;
        
        // Debug: Log query và params
        console.log('getBookingsByHotel - SQL:', sql);
        console.log('getBookingsByHotel - Params:', params);
        console.log('getBookingsByHotel - Filters:', { status, checkIn, checkOut });
        
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Lỗi lấy danh sách booking:', err);
                return res.status(500).json({ error: "Lỗi lấy danh sách đặt phòng" });
            }
            
            // Debug: Log kết quả
            console.log(`getBookingsByHotel - Found ${results.length} bookings for hotel ${hotelId}`);
            if (results.length > 0) {
                console.log('Sample booking:', {
                    BookingID: results[0].BookingID,
                    Status: results[0].Status,
                    CheckInDate: results[0].CheckInDate,
                    CheckOutDate: results[0].CheckOutDate
                });
            }
            
            res.json(results);
        });
    });
};

// 3. Xem chi tiết booking
exports.getBookingDetail = (req, res) => {
    const staffId = req.user.id;
    const bookingId = req.params.id;
    
        // Lấy thông tin booking và hotel
    db.query(
        `SELECT B.*, 
                A.Username, A.Email,
                R.RoomID as HotelID, R.RoomName, R.Address,
                RT.RoomTypeName, RT.Price as RoomTypePrice,
                C.CategoryName,
                IFNULL(B.CheckInConfirmed, 0) AS CheckInConfirmed,
                IFNULL(B.CheckOutConfirmed, 0) AS CheckOutConfirmed,
                B.RoomInspection
         FROM Bookings B
         JOIN Accounts A ON B.AccountID = A.AccountID
         JOIN Rooms R ON B.RoomID = R.RoomID
         LEFT JOIN RoomTypes RT ON B.RoomTypeID = RT.RoomTypeID
         LEFT JOIN Categories C ON R.CategoryID = C.CategoryID
         WHERE B.BookingID = ?`,
        [bookingId],
        (err, results) => {
            if (err) {
                console.error('Lỗi lấy chi tiết booking:', err);
                return res.status(500).json({ error: "Lỗi lấy chi tiết đặt phòng" });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: "Không tìm thấy đơn đặt phòng!" });
            }
            
            const booking = results[0];
            const hotelId = booking.HotelID;
            
            // Kiểm tra quyền
            checkStaffHotelAccess(staffId, hotelId, (err2, hasAccess) => {
                if (err2) {
                    console.error('Lỗi kiểm tra quyền:', err2);
                    return res.status(500).json({ error: "Lỗi kiểm tra quyền truy cập" });
                }
                
                if (!hasAccess) {
                    return res.status(403).json({ error: "Bạn không có quyền xem đơn đặt phòng này!" });
                }
                
                res.json(booking);
            });
        }
    );
};

// 4. Xác nhận check-in (đánh dấu đã confirm)
exports.confirmCheckIn = (req, res) => {
    const staffId = req.user.id;
    const bookingId = req.params.id;
    
    // Lấy thông tin booking
    db.query(
        `SELECT B.*, R.RoomID as HotelID
         FROM Bookings B
         JOIN Rooms R ON B.RoomID = R.RoomID
         WHERE B.BookingID = ?`,
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
            const hotelId = booking.HotelID;
            
            // Kiểm tra quyền
            checkStaffHotelAccess(staffId, hotelId, (err2, hasAccess) => {
                if (err2) {
                    console.error('Lỗi kiểm tra quyền:', err2);
                    return res.status(500).json({ error: "Lỗi kiểm tra quyền truy cập" });
                }
                
                if (!hasAccess) {
                    return res.status(403).json({ error: "Bạn không có quyền xác nhận check-in đơn đặt phòng này!" });
                }
                
                // Kiểm tra trạng thái hiện tại
                if (booking.Status !== 'CheckedIn') {
                    return res.status(400).json({ 
                        error: `Không thể xác nhận check-in! Trạng thái hiện tại: ${booking.Status}. Chỉ có thể xác nhận khi trạng thái là "CheckedIn".` 
                    });
                }
                
                // Cập nhật CheckInConfirmed
                db.query(
                    `UPDATE Bookings SET CheckInConfirmed = 1 WHERE BookingID = ?`,
                    [bookingId],
                    (err3) => {
                        if (err3) {
                            console.error('Lỗi cập nhật xác nhận check-in:', err3);
                            return res.status(500).json({ error: "Lỗi cập nhật xác nhận check-in" });
                        }
                        res.json({ 
                            message: "Xác nhận check-in thành công!",
                            bookingId: bookingId
                        });
                    }
                );
            });
        }
    );
};

// 4. Check-in booking
exports.checkInBooking = (req, res) => {
    const staffId = req.user.id;
    const bookingId = req.params.id;
    
    // Lấy thông tin booking
    db.query(
        `SELECT B.*, R.RoomID as HotelID
         FROM Bookings B
         JOIN Rooms R ON B.RoomID = R.RoomID
         WHERE B.BookingID = ?`,
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
            const hotelId = booking.HotelID;
            
            // Kiểm tra quyền
            checkStaffHotelAccess(staffId, hotelId, (err2, hasAccess) => {
                if (err2) {
                    console.error('Lỗi kiểm tra quyền:', err2);
                    return res.status(500).json({ error: "Lỗi kiểm tra quyền truy cập" });
                }
                
                if (!hasAccess) {
                    return res.status(403).json({ error: "Bạn không có quyền check-in đơn đặt phòng này!" });
                }
                
                // Kiểm tra trạng thái hiện tại
                if (booking.Status !== 'Confirmed' && booking.Status !== 'Pending') {
                    return res.status(400).json({ 
                        error: `Không thể check-in! Trạng thái hiện tại: ${booking.Status}. Chỉ có thể check-in từ "Pending" hoặc "Confirmed".` 
                    });
                }
                
                // Kiểm tra ngày check-in
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const checkInDate = new Date(booking.CheckInDate);
                checkInDate.setHours(0, 0, 0, 0);
                
                if (checkInDate > today) {
                    return res.status(400).json({ 
                        error: `Chưa đến ngày check-in! Ngày check-in là: ${booking.CheckInDate.toISOString().split('T')[0]}` 
                    });
                }
                
                // Cập nhật trạng thái thành CheckedIn
                db.query(
                    `UPDATE Bookings SET Status = 'CheckedIn' WHERE BookingID = ?`,
                    [bookingId],
                    (err3) => {
                        if (err3) {
                            console.error('Lỗi cập nhật trạng thái:', err3);
                            return res.status(500).json({ error: "Lỗi cập nhật trạng thái" });
                        }
                        res.json({ 
                            message: "Check-in thành công!",
                            bookingId: bookingId,
                            status: 'CheckedIn'
                        });
                    }
                );
            });
        }
    );
};

// 5. Quay lại trạng thái booking (tương tự admin)
exports.revertBookingStatus = (req, res) => {
    const staffId = req.user.id;
    const bookingId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ error: "Thiếu trạng thái mới!" });
    }
    
    const validStatuses = ['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Trạng thái không hợp lệ! Chỉ chấp nhận: ${validStatuses.join(', ')}` });
    }
    
    // Lấy thông tin booking
    db.query(
        `SELECT B.*, R.RoomID as HotelID, B.RoomTypeID, B.Rooms
         FROM Bookings B
         JOIN Rooms R ON B.RoomID = R.RoomID
         WHERE B.BookingID = ?`,
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
            const hotelId = booking.HotelID;
            const currentStatus = booking.Status;
            const roomTypeId = booking.RoomTypeID;
            const roomsCount = booking.Rooms || 1;
            
            // Kiểm tra quyền
            checkStaffHotelAccess(staffId, hotelId, (err2, hasAccess) => {
                if (err2) {
                    console.error('Lỗi kiểm tra quyền:', err2);
                    return res.status(500).json({ error: "Lỗi kiểm tra quyền truy cập" });
                }
                
                if (!hasAccess) {
                    return res.status(403).json({ error: "Bạn không có quyền quản lý đơn đặt phòng này!" });
                }
                
                // Nếu trạng thái không đổi, không cần làm gì
                if (currentStatus === status) {
                    return res.json({ message: "Trạng thái không thay đổi!" });
                }
                
                // Validate chuyển trạng thái (sử dụng logic từ bookingController)
                const validateStatusTransition = (current, next) => {
                    const validTransitions = {
                        'Pending': ['Confirmed', 'Cancelled'],
                        'Confirmed': ['CheckedIn', 'Pending', 'Cancelled'], // Cho phép quay lại Pending
                        'CheckedIn': ['CheckedOut', 'Confirmed'], // Cho phép quay lại Confirmed
                        'CheckedOut': [],
                        'Cancelled': []
                    };
                    
                    if (!validTransitions[current]) {
                        return { valid: false, error: `Trạng thái hiện tại không hợp lệ: ${current}` };
                    }
                    
                    if (!validTransitions[current].includes(next)) {
                        return { 
                            valid: false, 
                            error: `Không thể chuyển từ ${current} sang ${next}. Chỉ có thể chuyển sang: ${validTransitions[current].join(', ')}` 
                        };
                    }
                    
                    return { valid: true };
                };
                
                const validation = validateStatusTransition(currentStatus, status);
                if (!validation.valid) {
                    return res.status(400).json({ error: validation.error });
                }
                
                // Xử lý cập nhật số lượng phòng
                const statusesThatOccupyRooms = ['Pending', 'Confirmed', 'CheckedIn'];
                const statusesThatFreeRooms = ['Cancelled', 'CheckedOut'];
                
                const wasOccupying = statusesThatOccupyRooms.includes(currentStatus);
                const willOccupy = statusesThatOccupyRooms.includes(status);
                const willFree = statusesThatFreeRooms.includes(status);
                const wasFreed = statusesThatFreeRooms.includes(currentStatus);
                
                let availabilityOperation = null;
                if (wasOccupying && willFree) {
                    availabilityOperation = 'increase';
                } else if (wasFreed && willOccupy) {
                    availabilityOperation = 'decrease';
                }
                
                // Cập nhật số lượng phòng nếu cần
                if (availabilityOperation && roomTypeId) {
                    db.query(
                        `SELECT AvailableRooms FROM RoomTypes WHERE RoomTypeID = ? AND IsDeleted = 0`,
                        [roomTypeId],
                        (err3, roomTypeResults) => {
                            if (err3) {
                                if (err3.message && err3.message.includes("Unknown column 'AvailableRooms'")) {
                                    proceedWithStatusUpdate();
                                } else {
                                    return res.status(500).json({ error: "Lỗi kiểm tra số lượng phòng" });
                                }
                            } else {
                                const currentAvailable = roomTypeResults[0]?.AvailableRooms || 0;
                                
                                if (availabilityOperation === 'decrease' && currentAvailable < roomsCount) {
                                    return res.status(400).json({ 
                                        error: `Không đủ phòng! Chỉ còn ${currentAvailable} phòng trống.` 
                                    });
                                }
                                
                                const newAvailable = availabilityOperation === 'increase' 
                                    ? currentAvailable + roomsCount 
                                    : currentAvailable - roomsCount;
                                
                                db.query(
                                    `UPDATE RoomTypes SET AvailableRooms = ? WHERE RoomTypeID = ? AND IsDeleted = 0`,
                                    [newAvailable, roomTypeId],
                                    (err4) => {
                                        if (err4) {
                                            return res.status(500).json({ error: "Lỗi cập nhật số lượng phòng" });
                                        }
                                        proceedWithStatusUpdate();
                                    }
                                );
                            }
                        }
                    );
                } else {
                    proceedWithStatusUpdate();
                }
                
                function proceedWithStatusUpdate() {
                    // Cập nhật trạng thái
                    db.query(
                        "UPDATE Bookings SET Status = ? WHERE BookingID = ?",
                        [status, bookingId],
                        (err5) => {
                            if (err5) {
                                console.error('Lỗi cập nhật trạng thái:', err5);
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
            });
        }
    );
};

// 6. Check-out booking
exports.checkOutBooking = (req, res) => {
    const staffId = req.user.id;
    const bookingId = req.params.id;
    
    // Lấy thông tin booking
    db.query(
        `SELECT B.*, R.RoomID as HotelID, B.RoomTypeID, B.Rooms
         FROM Bookings B
         JOIN Rooms R ON B.RoomID = R.RoomID
         WHERE B.BookingID = ?`,
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
            const hotelId = booking.HotelID;
            const roomTypeId = booking.RoomTypeID;
            const roomsCount = booking.Rooms || 1;
            
            // Kiểm tra quyền
            checkStaffHotelAccess(staffId, hotelId, (err2, hasAccess) => {
                if (err2) {
                    console.error('Lỗi kiểm tra quyền:', err2);
                    return res.status(500).json({ error: "Lỗi kiểm tra quyền truy cập" });
                }
                
                if (!hasAccess) {
                    return res.status(403).json({ error: "Bạn không có quyền check-out đơn đặt phòng này!" });
                }
                
                // Kiểm tra trạng thái hiện tại
                if (booking.Status !== 'CheckedIn') {
                    return res.status(400).json({ 
                        error: `Không thể check-out! Trạng thái hiện tại: ${booking.Status}. Chỉ có thể check-out từ "CheckedIn".` 
                    });
                }
                
                // Kiểm tra ngày check-out
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const checkOutDate = new Date(booking.CheckOutDate);
                checkOutDate.setHours(0, 0, 0, 0);
                
                if (checkOutDate > today) {
                    return res.status(400).json({ 
                        error: `Chưa đến ngày check-out! Ngày check-out là: ${booking.CheckOutDate.toISOString().split('T')[0]}. Chỉ có thể check-out từ ngày này trở đi.` 
                    });
                }
                
                // Cập nhật trạng thái thành CheckedOut và tăng lại số lượng phòng
                db.query(
                    `UPDATE Bookings SET Status = 'CheckedOut' WHERE BookingID = ?`,
                    [bookingId],
                    (err3) => {
                        if (err3) {
                            console.error('Lỗi cập nhật trạng thái:', err3);
                            return res.status(500).json({ error: "Lỗi cập nhật trạng thái" });
                        }
                        
                        // Tăng lại số lượng phòng nếu có RoomTypeID
                        if (roomTypeId) {
                            db.query(
                                `UPDATE RoomTypes 
                                 SET AvailableRooms = AvailableRooms + ? 
                                 WHERE RoomTypeID = ? 
                                 AND IsDeleted = 0`,
                                [roomsCount, roomTypeId],
                                (err4) => {
                                    if (err4) {
                                        console.error('Lỗi cập nhật số lượng phòng:', err4);
                                        // Không return error, chỉ log vì booking đã được cập nhật
                                    }
                                }
                            );
                        }
                        
                        res.json({ 
                            message: "Check-out thành công!",
                            bookingId: bookingId,
                            status: 'CheckedOut'
                        });
                    }
                );
            });
        }
    );
};

// 7. Xác nhận check-out và kiểm tra phòng
exports.confirmCheckOut = (req, res) => {
    const staffId = req.user.id;
    const bookingId = req.params.id;
    const { roomInspection } = req.body; // Thông tin kiểm tra phòng
    
    // Lấy thông tin booking
    db.query(
        `SELECT B.*, R.RoomID as HotelID
         FROM Bookings B
         JOIN Rooms R ON B.RoomID = R.RoomID
         WHERE B.BookingID = ?`,
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
            const hotelId = booking.HotelID;
            
            // Kiểm tra quyền
            checkStaffHotelAccess(staffId, hotelId, (err2, hasAccess) => {
                if (err2) {
                    console.error('Lỗi kiểm tra quyền:', err2);
                    return res.status(500).json({ error: "Lỗi kiểm tra quyền truy cập" });
                }
                
                if (!hasAccess) {
                    return res.status(403).json({ error: "Bạn không có quyền xác nhận check-out đơn đặt phòng này!" });
                }
                
                // Kiểm tra trạng thái hiện tại
                if (booking.Status !== 'CheckedOut') {
                    return res.status(400).json({ 
                        error: `Không thể xác nhận check-out! Trạng thái hiện tại: ${booking.Status}. Chỉ có thể xác nhận khi trạng thái là "CheckedOut".` 
                    });
                }
                
                // Cập nhật CheckOutConfirmed và RoomInspection
                db.query(
                    `UPDATE Bookings 
                     SET CheckOutConfirmed = 1, 
                         RoomInspection = ? 
                     WHERE BookingID = ?`,
                    [roomInspection || null, bookingId],
                    (err3) => {
                        if (err3) {
                            console.error('Lỗi cập nhật xác nhận check-out:', err3);
                            // Nếu cột chưa tồn tại, thử lại không có các cột này
                            if (err3.message.includes("Unknown column 'CheckOutConfirmed'") || 
                                err3.message.includes("Unknown column 'RoomInspection'")) {
                                return res.status(500).json({ 
                                    error: "Database chưa được cập nhật! Vui lòng chạy migration 15_add_checkout_confirmation.sql" 
                                });
                            }
                            return res.status(500).json({ error: "Lỗi cập nhật xác nhận check-out" });
                        }
                        res.json({ 
                            message: "Xác nhận check-out và kiểm tra phòng thành công!",
                            bookingId: bookingId
                        });
                    }
                );
            });
        }
    );
};

