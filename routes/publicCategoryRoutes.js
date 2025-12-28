const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// API Public: Lấy danh sách danh mục cho khách hàng lọc phòng
router.get('/categories', categoryController.getAllCategories);

module.exports = router;


