const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { verifyStaff } = require('../middleware/authMiddleware');

// Tất cả routes đều cần quyền Staff
router.get('/hotels', verifyStaff, staffController.getMyHotels);
router.get('/hotels/:hotelId/bookings', verifyStaff, staffController.getBookingsByHotel);
router.get('/bookings/:id', verifyStaff, staffController.getBookingDetail);
router.post('/bookings/:id/checkin', verifyStaff, staffController.checkInBooking);
router.post('/bookings/:id/confirm-checkin', verifyStaff, staffController.confirmCheckIn);
router.post('/bookings/:id/checkout', verifyStaff, staffController.checkOutBooking);
router.post('/bookings/:id/confirm-checkout', verifyStaff, staffController.confirmCheckOut);
router.put('/bookings/:id/status', verifyStaff, staffController.revertBookingStatus);

module.exports = router;

