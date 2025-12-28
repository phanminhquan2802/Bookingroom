const db = require('../config/db');

exports.createReview = (req, res) => {
    const { roomId, bookingId, rating, comment } = req.body; 
    const userId = req.user.id;
    
    // 1. Kiểm tra thông tin đầu vào
    if (!roomId || !bookingId || rating === undefined || rating === null) {
        return res.status(400).json({ error: "Thiếu thông tin! Vui lòng cung cấp roomId, bookingId, rating" });
    }
    
    // 2. Validate rating (0-10)
    const ratingNum = parseFloat(rating);
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
        return res.status(400).json({ error: "Rating phải là số từ 0 đến 10!" });
    }
    
    // 3. Kiểm tra booking tồn tại, thuộc về user, đã checkout và checkOutDate đã qua
    const sqlCheck = `
        SELECT B.*, R.RoomID as BookingRoomID 
        FROM Bookings B
        JOIN Rooms R ON B.RoomID = R.RoomID
        WHERE B.BookingID = ? 
        AND B.AccountID = ? 
        AND B.Status = 'CheckedOut'
    `;
    
    db.query(sqlCheck, [bookingId, userId], (err, bookings) => {
        if (err) {
            console.error('Lỗi kiểm tra booking:', err);
            return res.status(500).json({ error: "Lỗi kiểm tra đơn đặt phòng" });
        }
        
        if (bookings.length === 0) {
            return res.status(403).json({ error: "Đơn hàng không hợp lệ hoặc chưa được checkout!" });
        }
        
        const booking = bookings[0];
        
        // 4. Kiểm tra roomId khớp với booking
        if (parseInt(booking.BookingRoomID) !== parseInt(roomId)) {
            return res.status(400).json({ error: "roomId không khớp với bookingId!" });
        }
        
        // 5. Kiểm tra checkOutDate đã qua chưa
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkOutDate = new Date(booking.CheckOutDate);
        checkOutDate.setHours(0, 0, 0, 0);
        
        if (checkOutDate > today) {
            return res.status(400).json({ error: "Chỉ có thể đánh giá sau khi đã checkout!" });
        }
        
        // 6. Kiểm tra đã đánh giá chưa
        db.query(`SELECT ReviewID FROM Reviews WHERE BookingID = ?`, [bookingId], (err, reviews) => {
            if (err) {
                console.error('Lỗi kiểm tra review:', err);
                return res.status(500).json({ error: "Lỗi kiểm tra đánh giá" });
            }
            
            if (reviews.length > 0) {
                return res.status(400).json({ error: "Bạn đã đánh giá đơn đặt phòng này rồi!" });
            }
            
            // 7. Tạo review
            db.query(
                "INSERT INTO Reviews (RoomID, AccountID, BookingID, Rating, Comment) VALUES (?, ?, ?, ?, ?)",
                [roomId, userId, bookingId, ratingNum, comment || null],
                (err, result) => {
                    if (err) {
                        console.error('Lỗi tạo review:', err);
                        return res.status(500).json({ error: "Lỗi lưu đánh giá: " + err.message });
                    }
                    res.json({ 
                        message: "Đánh giá thành công!",
                        reviewId: result.insertId
                    });
                }
            );
        });
    });
};

exports.getRoomReviews = (req, res) => {
    const sql = `SELECT R.*, A.Username FROM Reviews R JOIN Accounts A ON R.AccountID = A.AccountID WHERE R.RoomID = ? ORDER BY R.CreatedAt DESC`;
    db.query(sql, [req.params.roomId], (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi Server" });
        res.json(results);
    });
};