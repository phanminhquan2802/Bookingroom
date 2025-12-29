// npm init -y
// tải các thư viện: npm install express cors mysql2 dotenv bcryptjs jsonwebtoken


const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./config/db'); 
const emailService = require('./services/emailService');

const app = express();

/* =========================================
   1. MIDDLEWARES (Cấu hình chung)
   ========================================= */
app.use(cors());                 // Cho phép gọi API từ bên ngoài
app.use(express.json());         // Đọc dữ liệu JSON từ Client gửi lên
app.use(express.static('public')); // Phục vụ các file giao diện (html, css, js, ảnh)

/* =========================================
   2. IMPORT ROUTES (Nhập các file đường dẫn)
   ========================================= */
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const publicCategoryRoutes = require('./routes/publicCategoryRoutes');
const roomTypeRoutes = require('./routes/roomTypeRoutes');
const staffRoutes = require('./routes/staffRoutes');

/* =========================================
   3. ĐỊNH NGHĨA ĐƯỜNG DẪN API (Mounting)
   ========================================= */

// API Xác thực (Login/Register)
// Đường dẫn: /api/login, /api/register
app.use('/api', authRoutes);

// API Phòng (Tìm kiếm & Quản lý)
// Đường dẫn: /api/rooms (Public) và /api/rooms/admin (Admin)
app.use('/api', roomRoutes);

// API Đặt phòng (Đặt, Lịch sử, Quản lý đơn)
// Đường dẫn: /api/bookings
app.use('/api', bookingRoutes);

// API Đánh giá
// Đường dẫn: /api/reviews
app.use('/api/reviews', reviewRoutes);

// API Quản lý Người dùng (Dành cho Admin)
// Đường dẫn: /api/admin/users
app.use('/api/admin/users', userRoutes);

// API Quản lý Danh mục (Dành cho Admin)
// Đường dẫn: /api/admin/categories
app.use('/api/admin/categories', categoryRoutes);

// API Danh mục public (cho khách hàng lọc phòng)
// Đường dẫn: /api/categories
app.use('/api', publicCategoryRoutes);

// API Loại phòng (RoomTypes)
// Đường dẫn: /api/hotels/:hotelId/roomtypes, /api/roomtypes/:id
app.use('/api', roomTypeRoutes);

// API Nhân viên (Staff)
// Đường dẫn: /api/staff/*
app.use('/api/staff', staffRoutes);

// API gửi email tùy chỉnh
// Body: { userEmail, emailSubject, emailBody }
app.post('/api/sendmail', async (req, res) => {
    try {
        const { userEmail, emailSubject, emailBody } = req.body;

        if (!userEmail || !emailSubject || !emailBody) {
            return res.status(400).json({ error: 'Thiếu thông tin: userEmail, emailSubject, emailBody' });
        }

        const result = await emailService.sendCustomEmail(userEmail, emailSubject, emailBody);

        if (!result.success) {
            return res.status(500).json({ error: result.error || 'Gửi email thất bại' });
        }

        res.json({ message: 'Gửi email thành công', messageId: result.messageId });
    } catch (error) {
        console.error('❌ Lỗi API /api/sendmail:', error);
        res.status(500).json({ error: 'Lỗi server khi gửi email' });
    }
});

/* =========================================
   4. KHỞI CHẠY SERVER
   ========================================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📂 Cấu trúc MVC đã sẵn sàng!`);
});