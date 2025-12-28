const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

exports.login = (req, res) => {
    const { username, password } = req.body;
    db.query("SELECT * FROM Accounts WHERE Username = ? AND (IsDeleted = 0 OR IsDeleted IS NULL)", [username], (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi Server" });
        if (results.length === 0) return res.status(401).json({ error: "Sai tên đăng nhập hoặc tài khoản đã bị xóa!" });

        const user = results[0];
        // Kiểm tra lại IsDeleted để đảm bảo
        if (user.IsDeleted === 1) {
            return res.status(401).json({ error: "Tài khoản đã bị xóa và không thể đăng nhập!" });
        }
        
        // Kiểm tra tài khoản có bị khóa không (IsLocked = 1)
        // Sử dụng IFNULL để tương thích với trường hợp cột IsLocked chưa tồn tại
        const isLocked = user.IsLocked !== undefined && user.IsLocked !== null ? user.IsLocked : 0;
        if (isLocked === 1) {
            return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa! Vui lòng liên hệ quản trị viên." });
        }
        
        bcrypt.compare(password, user.PasswordHash, (err, isMatch) => {
            if (isMatch) {
                const token = jwt.sign({ id: user.AccountID, role: user.RoleID }, process.env.JWT_SECRET, { expiresIn: '24h' });
                res.json({token, role: user.RoleID, username: user.Username });
            } else res.status(401).json({ error: "Sai mật khẩu!" });
        });
    });
};

// Helper function: Validate email format
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Helper function: Validate password strength
const validatePassword = (password) => {
    if (!password || password.length < 6) {
        return { valid: false, error: "Mật khẩu phải có ít nhất 6 ký tự!" };
    }
    return { valid: true };
};

exports.register = (req, res) => {
    const { username, email, password } = req.body;
    
    // 1. Kiểm tra thông tin đầu vào
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Thiếu thông tin! Vui lòng cung cấp username, email, password" });
    }
    
    // 2. Validate username
    if (username.trim().length < 3) {
        return res.status(400).json({ error: "Username phải có ít nhất 3 ký tự!" });
    }
    
    // 3. Validate email format
    if (!validateEmail(email)) {
        return res.status(400).json({ error: "Email không hợp lệ!" });
    }
    
    // 4. Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.error });
    }

    // 5. Kiểm tra tài khoản đã tồn tại
    db.query("SELECT * FROM Accounts WHERE Username = ? OR Email = ?", [username.trim(), email.toLowerCase()], (err, results) => {
        if (err) {
            console.error('Lỗi kiểm tra tài khoản:', err);
            return res.status(500).json({ error: "Lỗi kiểm tra tài khoản" });
        }
        
        if (results.length > 0) {
            const existing = results[0];
            if (existing.Username === username.trim()) {
                return res.status(409).json({ error: "Username đã tồn tại!" });
            }
            if (existing.Email === email.toLowerCase()) {
                return res.status(409).json({ error: "Email đã được sử dụng!" });
            }
        }

        // 6. Hash password và tạo tài khoản
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error('Lỗi hash password:', err);
                return res.status(500).json({ error: "Lỗi mã hóa mật khẩu" });
            }
            
            db.query(
                "INSERT INTO Accounts (Username, Email, PasswordHash, RoleID) VALUES (?, ?, ?, 2)", 
                [username.trim(), email.toLowerCase(), hash], 
                (err, result) => {
                    if(err) {
                        console.error('Lỗi tạo tài khoản:', err);
                        return res.status(500).json({ error: "Lỗi tạo tài khoản: " + err.message });
                    }
                    
                    // Gửi email chào mừng (không chặn response nếu lỗi)
                    emailService.sendWelcomeEmail(email.toLowerCase(), username.trim()).catch(err => {
                        console.error('Lỗi gửi email chào mừng (không ảnh hưởng đăng ký):', err);
                    });
                    
                    res.status(201).json({ 
                        message: "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.",
                        userId: result.insertId
                    });
                }
            );
        });
    });
};

// Quên mật khẩu - Gửi email reset password (link)
exports.forgotPassword = (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: "Vui lòng nhập email!" });
    }

    // Tìm user theo email (chỉ tài khoản chưa bị xóa)
    db.query("SELECT * FROM Accounts WHERE Email = ? AND (IsDeleted = 0 OR IsDeleted IS NULL)", [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi Server" });
        
        // Luôn trả về thành công để bảo mật (không cho biết email có tồn tại hay không)
        if (results.length === 0) {
            return res.json({ message: "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu." });
        }

        const user = results[0];
        
        // Tạo reset token ngẫu nhiên
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Đặt thời gian hết hạn: 1 giờ từ bây giờ
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

        // Lưu token vào database
        db.query(
            "UPDATE Accounts SET ResetPasswordToken = ?, ResetPasswordExpires = ? WHERE AccountID = ?",
            [resetTokenHash, resetExpires, user.AccountID],
            async (err) => {
                if (err) return res.status(500).json({ error: "Lỗi lưu token" });

                try {
                    // Gửi email reset password chứa link
                    await emailService.sendPasswordResetEmail(email, resetToken);
                    res.json({ message: "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu." });
                } catch (emailError) {
                    console.error('Lỗi gửi email:', emailError);
                    res.status(500).json({ error: "Không thể gửi email. Vui lòng thử lại sau." });
                }
            }
        );
    });
};

// Đặt lại mật khẩu - Sử dụng token từ email
exports.resetPassword = (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
        return res.status(400).json({ error: "Thiếu thông tin!" });
    }

    // Hash token để so sánh với database
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Tìm user với token hợp lệ và chưa hết hạn
    db.query(
        "SELECT * FROM Accounts WHERE ResetPasswordToken = ? AND ResetPasswordExpires > NOW()",
        [resetTokenHash],
        (err, results) => {
            if (err) return res.status(500).json({ error: "Lỗi Server" });
            
            if (results.length === 0) {
                return res.status(400).json({ error: "Token không hợp lệ hoặc đã hết hạn!" });
            }

            const user = results[0];

            // Hash mật khẩu mới
            bcrypt.hash(newPassword, 10, (err, hash) => {
                if (err) return res.status(500).json({ error: "Lỗi mã hóa mật khẩu" });

                // Cập nhật mật khẩu và xóa reset token
                db.query(
                    "UPDATE Accounts SET PasswordHash = ?, ResetPasswordToken = NULL, ResetPasswordExpires = NULL WHERE AccountID = ?",
                    [hash, user.AccountID],
                    (err) => {
                        if (err) return res.status(500).json({ error: "Lỗi cập nhật mật khẩu" });
                        
                        res.json({ message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới." });
                    }
                );
            });
        }
    );
};