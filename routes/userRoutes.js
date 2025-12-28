const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Tất cả chức năng quản lý User đều cần quyền Admin
router.get('/', verifyAdmin, userController.getAllUsers);
router.post('/', verifyAdmin, userController.createUser);
router.put('/:id', verifyAdmin, userController.updateUser);
router.delete('/:id', verifyAdmin, userController.deleteUser);

module.exports = router;