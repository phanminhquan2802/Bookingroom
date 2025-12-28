const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// 1. Khách đặt phòng
router.post('/bookings', verifyToken, bookingController.createBooking);

// 2. Khách xem lịch sử
router.get('/bookings/my-bookings', verifyToken, bookingController.getMyBookings);

// 3. Admin lấy danh sách
router.get('/admin/bookings', verifyAdmin, bookingController.getAllBookings);

// 4. Admin duyệt/hủy đơn
router.put('/admin/bookings/:id', verifyAdmin, bookingController.updateBookingStatus);

module.exports = router;