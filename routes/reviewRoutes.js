const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route công khai (Ai cũng xem được)
router.get('/:roomId', reviewController.getRoomReviews);

// Route bảo mật (Phải đăng nhập mới được viết review)
router.post('/', verifyToken, reviewController.createReview);

module.exports = router;