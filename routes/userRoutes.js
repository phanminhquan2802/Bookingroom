const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Tất cả chức năng quản lý User đều cần quyền Admin
router.get('/', verifyAdmin, userController.getAllUsers);
router.post('/', verifyAdmin, userController.createUser);
router.put('/:id', verifyAdmin, userController.updateUser);
router.delete('/:id', verifyAdmin, userController.deleteUser);

// API Quản lý Nhân viên (Staff)
const adminStaffController = require('../controllers/adminStaffController');
router.get('/staff', verifyAdmin, adminStaffController.getAllStaff);
router.post('/staff', verifyAdmin, adminStaffController.createStaff);
router.post('/staff/assign-hotel', verifyAdmin, adminStaffController.assignHotelToStaff);
router.post('/staff/remove-hotel', verifyAdmin, adminStaffController.removeHotelFromStaff);
router.get('/staff/:staffId/hotels', verifyAdmin, adminStaffController.getStaffHotels);

module.exports = router;