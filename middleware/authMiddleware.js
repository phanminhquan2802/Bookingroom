const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "Không có quyền truy cập!" });

    try {
        const cleanToken = token.replace('Bearer ', '');
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
        if (decoded.role === 1) {
            req.user = decoded;
            next();
        } else {
            return res.status(403).json({ error: "Bạn không phải là Admin!" });
        }
    } catch (err) {
        return res.status(401).json({ error: "Token lỗi hoặc hết hạn!" });
    }
};

exports.verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "Vui lòng đăng nhập!" });

    try {
        const cleanToken = token.replace('Bearer ', '');
        req.user = jwt.verify(cleanToken, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token hết hạn!" });
    }
};

// Middleware: Xác thực Staff (RoleID = 3)
exports.verifyStaff = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "Không có quyền truy cập!" });

    try {
        const cleanToken = token.replace('Bearer ', '');
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
        if (decoded.role === 3) {
            req.user = decoded;
            next();
        } else {
            return res.status(403).json({ error: "Bạn không phải là Nhân viên!" });
        }
    } catch (err) {
        return res.status(401).json({ error: "Token lỗi hoặc hết hạn!" });
    }
};

// Middleware: Xác thực Admin hoặc Staff
exports.verifyAdminOrStaff = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "Không có quyền truy cập!" });

    try {
        const cleanToken = token.replace('Bearer ', '');
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
        if (decoded.role === 1 || decoded.role === 3) {
            req.user = decoded;
            next();
        } else {
            return res.status(403).json({ error: "Bạn không có quyền truy cập!" });
        }
    } catch (err) {
        return res.status(401).json({ error: "Token lỗi hoặc hết hạn!" });
    }
};