const nodemailer = require('nodemailer');
require('dotenv').config();

// Tạo transporter (có thể dùng Gmail, SMTP, etc.)
const createTransporter = () => {
    // Nếu có cấu hình SMTP trong .env, dùng nó
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log('📧 Sử dụng SMTP:', process.env.SMTP_HOST);
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            // Thêm tls nếu cần
            tls: {
                rejectUnauthorized: false // Chỉ dùng trong development, production nên để true
            }
        });
        
        // Verify connection (async, không chặn)
        transporter.verify((error, success) => {
            if (error) {
                console.error('❌ SMTP Connection Error:', error);
            } else {
                console.log('✅ SMTP Server is ready to take our messages');
            }
        });
        
        return transporter;
    }
    
    // Mặc định dùng Gmail (cần cấu hình App Password)
    // Hoặc có thể dùng service khác như SendGrid, Mailgun, etc.
    console.log('📧 Sử dụng Gmail');
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com',
            pass: process.env.EMAIL_PASS || 'your-app-password'
        }
    });
};

// Tạo HTML template cho hóa đơn
const createInvoiceHTML = (booking) => {
    const checkIn = new Date(booking.CheckInDate);
    const checkOut = new Date(booking.CheckOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    const pricePerNight = booking.RoomTypePrice || booking.Price || 0;
    const basePrice = pricePerNight * nights * (booking.Rooms || 1);
    const tax = basePrice * 0.08;
    const total = basePrice + tax;
    const depositAmount = booking.DepositAmount || 0;
    const remaining = total - depositAmount;
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
    };
    
    const formatDate = (date) => {
        const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const months = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
                       'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
        return `${daysOfWeek[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
    };
    
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hóa đơn đặt phòng</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .invoice-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #0071c2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #0071c2;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #666;
            margin: 5px 0;
        }
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .info-section {
            flex: 1;
        }
        .info-section h3 {
            color: #0071c2;
            border-bottom: 2px solid #0071c2;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .info-item strong {
            color: #333;
            display: inline-block;
            width: 120px;
        }
        .booking-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .booking-details h3 {
            color: #0071c2;
            margin-top: 0;
        }
        .price-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .price-table th {
            background: #0071c2;
            color: white;
            padding: 12px;
            text-align: left;
        }
        .price-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        .price-table tr:last-child td {
            border-bottom: none;
        }
        .total-row {
            background: #e7f3ff;
            font-weight: bold;
        }
        .deposit-info {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            background: #28a745;
            color: white;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <h1>HÓA ĐƠN ĐẶT PHÒNG</h1>
            <p>Booking Hotel</p>
            <p>Mã đơn: #${booking.BookingID}</p>
        </div>
        
        <div class="invoice-info">
            <div class="info-section">
                <h3>Thông tin khách hàng</h3>
                <div class="info-item">
                    <strong>Họ tên:</strong> ${booking.GuestName || booking.Username || 'N/A'}
                </div>
                <div class="info-item">
                    <strong>Email:</strong> ${booking.GuestEmail || booking.Email || 'N/A'}
                </div>
                <div class="info-item">
                    <strong>Điện thoại:</strong> ${booking.GuestPhone || 'N/A'}
                </div>
            </div>
            
            <div class="info-section">
                <h3>Thông tin đặt phòng</h3>
                <div class="info-item">
                    <strong>Ngày đặt:</strong> ${formatDate(new Date(booking.BookingDate))}
                </div>
                <div class="info-item">
                    <strong>Trạng thái:</strong> <span class="status-badge">Đã xác nhận</span>
                </div>
            </div>
        </div>
        
        <div class="booking-details">
            <h3>Chi tiết đặt phòng</h3>
            <div class="info-item">
                <strong>Khách sạn:</strong> ${booking.RoomName || 'N/A'}
            </div>
            <div class="info-item">
                <strong>Loại phòng:</strong> ${booking.RoomTypeName || 'N/A'}
            </div>
            <div class="info-item">
                <strong>Nhận phòng:</strong> ${formatDate(checkIn)}
            </div>
            <div class="info-item">
                <strong>Trả phòng:</strong> ${formatDate(checkOut)}
            </div>
            <div class="info-item">
                <strong>Số đêm:</strong> ${nights} đêm
            </div>
            <div class="info-item">
                <strong>Số phòng:</strong> ${booking.Rooms || 1} phòng
            </div>
            <div class="info-item">
                <strong>Số khách:</strong> ${booking.Adults || 0} người lớn, ${booking.Children || 0} trẻ em
            </div>
        </div>
        
        <table class="price-table">
            <thead>
                <tr>
                    <th>Mô tả</th>
                    <th style="text-align: right;">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Giá phòng (${nights} đêm × ${booking.Rooms || 1} phòng)</td>
                    <td style="text-align: right;">${formatCurrency(basePrice)}</td>
                </tr>
                <tr>
                    <td>Thuế GTGT (8%)</td>
                    <td style="text-align: right;">${formatCurrency(tax)}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Tổng cộng</strong></td>
                    <td style="text-align: right;"><strong>${formatCurrency(total)}</strong></td>
                </tr>
            </tbody>
        </table>
        
        <div class="deposit-info">
            <h3 style="margin-top: 0; color: #856404;">Thông tin đặt cọc</h3>
            <div class="info-item">
                <strong>Tiền cọc đã thanh toán:</strong> ${formatCurrency(depositAmount)}
            </div>
            <div class="info-item">
                <strong>Còn lại:</strong> ${formatCurrency(remaining)}
            </div>
            <p style="margin-top: 10px; color: #856404; font-size: 14px;">
                <strong>Lưu ý:</strong> Số tiền còn lại sẽ được thanh toán khi bạn đến nhận phòng.
            </p>
        </div>
        
        <div class="footer">
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            <p>Nếu có thắc mắc, vui lòng liên hệ: ${process.env.SUPPORT_EMAIL || 'support@bookinghotel.com'}</p>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Đây là email tự động, vui lòng không trả lời email này.
            </p>
        </div>
    </div>
</body>
</html>
    `;
};

// Gửi email hóa đơn
exports.sendInvoiceEmail = async (booking) => {
    try {
        console.log('📧 Bắt đầu gửi email hóa đơn...');
        console.log('📧 Booking ID:', booking.BookingID);
        
        const transporter = createTransporter();
        console.log('📧 Transporter đã được tạo');
        
        const email = booking.GuestEmail || booking.Email;
        if (!email) {
            console.error('❌ Không có email để gửi hóa đơn');
            console.error('❌ GuestEmail:', booking.GuestEmail);
            console.error('❌ Email:', booking.Email);
            return { success: false, error: 'Không có email' };
        }
        
        console.log('📧 Email người nhận:', email);
        
        // Xác định địa chỉ email gửi đi
        // Ưu tiên: EMAIL_FROM > SMTP_USER > EMAIL_USER > mặc định
        const fromEmail = process.env.EMAIL_FROM 
            || process.env.SMTP_USER 
            || process.env.EMAIL_USER 
            || 'noreply@bookinghotel.com';
        
        console.log('📧 Email người gửi:', fromEmail);
        console.log('📧 SMTP Config:', {
            host: process.env.SMTP_HOST || 'Gmail',
            port: process.env.SMTP_PORT || 587,
            user: process.env.SMTP_USER || process.env.EMAIL_USER || 'N/A'
        });
        
        const mailOptions = {
            from: fromEmail,
            to: email,
            subject: `Hóa đơn đặt phòng #${booking.BookingID} - Booking Hotel`,
            html: createInvoiceHTML(booking),
            text: `Hóa đơn đặt phòng #${booking.BookingID}\n\nKhách sạn: ${booking.RoomName}\nLoại phòng: ${booking.RoomTypeName}\nTổng tiền: ${booking.DepositAmount} VNĐ`
        };
        
        console.log('📧 Đang gửi email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email đã được gửi thành công!');
        console.log('✅ Message ID:', info.messageId);
        console.log('✅ Response:', info.response);
        return { success: true, messageId: info.messageId, response: info.response };
    } catch (error) {
        console.error('❌ Lỗi gửi email:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error stack:', error.stack);
        return { success: false, error: error.message, code: error.code };
    }
};
