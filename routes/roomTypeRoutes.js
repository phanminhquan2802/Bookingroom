const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomTypeController');
const { verifyAdmin } = require('../middleware/authMiddleware');

// API Public: Lấy các loại phòng theo hotel
router.get('/hotels/:hotelId/roomtypes', roomTypeController.getRoomTypesByHotel);

// API Public: Lấy chi tiết loại phòng
router.get('/roomtypes/:id', roomTypeController.getRoomTypeDetail);

// API Public: Lấy tiện nghi của loại phòng
router.get('/roomtypes/:id/amenities', roomTypeController.getRoomTypeAmenities);

// API Public: Lấy phòng trống theo loại phòng
router.get('/roomtypes/available', roomTypeController.getAvailableRoomTypes);

// API Admin: CRUD RoomTypes
router.get('/admin/roomtypes', verifyAdmin, roomTypeController.getAllRoomTypesAdmin);
router.post('/admin/roomtypes', verifyAdmin, roomTypeController.createRoomType);
router.put('/admin/roomtypes/:id', verifyAdmin, roomTypeController.updateRoomType);
router.delete('/admin/roomtypes/:id', verifyAdmin, roomTypeController.deleteRoomType);

module.exports = router;

