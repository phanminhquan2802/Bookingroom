const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// 1. Khách đặt phòng
router.post('/bookings', verifyToken, bookingController.createBooking);

// 2. Khách xem lịch sử
router.get('/bookings/my-bookings', verifyToken, bookingController.getMyBookings);

// 3. Khách xác nhận đã chuyển khoản đặt cọc
router.post('/bookings/:id/confirm-deposit', verifyToken, bookingController.confirmDeposit);

// 4. Khách hủy đơn của chính họ
router.put('/bookings/:id/cancel', verifyToken, bookingController.cancelBooking);

// 5. Admin lấy danh sách
router.get('/admin/bookings', verifyAdmin, bookingController.getAllBookings);

// 6. Admin duyệt/hủy đơn
router.put('/admin/bookings/:id', verifyAdmin, bookingController.updateBookingStatus);

module.exports = router;