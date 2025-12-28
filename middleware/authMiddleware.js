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