const nodemailer = require('nodemailer');
require('dotenv').config();

// Cấu hình transporter cho email
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true cho port 465, false cho các port khác
    auth: {
        user: process.env.SMTP_USER, // Email gửi
        pass: process.env.SMTP_PASS  // Mật khẩu ứng dụng (App Password) hoặc mật khẩu email
    }
});

// Hàm gửi email tùy ý (dùng cho API /api/sendmail)
exports.sendCustomEmail = async (to, subject, html, text) => {
    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Hotel Booking'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        // Nếu có truyền text thì dùng, nếu không thì lấy từ html bỏ tag cơ bản
        text: text || undefined,
        html: html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email tùy chỉnh đã được gửi:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Lỗi gửi email tùy chỉnh:', error);
        return { success: false, error: error.message };
    }
};

// Hàm gửi email chào mừng khi đăng ký
exports.sendWelcomeEmail = async (email, username) => {
    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Hotel Booking'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Chào mừng đến với Hotel Booking! 🎉',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">Chào mừng ${username}! 🎉</h1>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Cảm ơn bạn đã đăng ký tài khoản tại <strong>Hotel Booking</strong>!
                    </p>
                    
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Tài khoản của bạn đã được tạo thành công. Bây giờ bạn có thể:
                    </p>
                    
                    <ul style="font-size: 16px; color: #333; line-height: 1.8;">
                        <li>Đăng nhập vào hệ thống</li>
                        <li>Tìm kiếm và đặt phòng khách sạn</li>
                        <li>Xem lịch sử đặt phòng</li>
                        <li>Đánh giá các phòng đã ở</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login.html" 
                           style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Đăng nhập ngay
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p style="font-size: 14px; color: #777; text-align: center; margin: 0;">
                        Nếu bạn không phải người tạo tài khoản này, vui lòng bỏ qua email này.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email chào mừng đã được gửi:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Lỗi gửi email chào mừng:', error);
        return { success: false, error: error.message };
    }
};

// Hàm gửi email reset password
exports.sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password.html?token=${resetToken}`;
    
    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Hotel Booking'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Đặt lại mật khẩu - Hotel Booking 🔐',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">Đặt lại mật khẩu 🔐</h1>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
                    </p>
                    
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Nhấn vào nút bên dưới để đặt lại mật khẩu của bạn:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                            Đặt lại mật khẩu
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; line-height: 1.6;">
                        <strong>Lưu ý:</strong> Link này sẽ hết hạn sau <strong>1 giờ</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                    </p>
                    
                    <p style="font-size: 14px; color: #666; line-height: 1.6;">
                        Nếu nút không hoạt động, bạn có thể copy và dán link sau vào trình duyệt:
                    </p>
                    <p style="font-size: 12px; color: #667eea; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                        ${resetUrl}
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p style="font-size: 12px; color: #777; text-align: center; margin: 0;">
                        Email này được gửi tự động, vui lòng không trả lời email này.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email đặt lại mật khẩu đã được gửi:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Lỗi gửi email đặt lại mật khẩu:', error);
        return { success: false, error: error.message };
    }
};

// Hàm kiểm tra kết nối email
exports.verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ SMTP server đã sẵn sàng');
        return true;
    } catch (error) {
        console.error('❌ Lỗi kết nối SMTP:', error);
        return false;
    }
};

