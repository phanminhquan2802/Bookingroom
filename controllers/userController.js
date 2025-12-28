const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 1. Lấy danh sách user
exports.getAllUsers = (req, res) => {
    const sql = `SELECT AccountID, Username, Email, RoleID, CreatedAt, 
                        IFNULL(IsDeleted, 0) AS IsDeleted, 
                        IFNULL(IsLocked, 0) AS IsLocked 
                 FROM Accounts 
                 WHERE IsDeleted = 0 OR IsDeleted IS NULL`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Lỗi lấy danh sách user:', err);
            // Nếu cột IsLocked chưa tồn tại, thử lại không có IsLocked
            if (err.message.includes("Unknown column 'IsLocked'")) {
                const sqlFallback = "SELECT AccountID, Username, Email, RoleID, CreatedAt, IFNULL(IsDeleted, 0) AS IsDeleted, 0 AS IsLocked FROM Accounts WHERE IsDeleted = 0 OR IsDeleted IS NULL";
                db.query(sqlFallback, (err2, results2) => {
                    if (err2) {
                        return res.status(500).json({ error: "Lỗi lấy dữ liệu: " + (err2.sqlMessage || err2.message) });
                    }
                    res.json(results2);
                });
                return;
            }
            return res.status(500).json({ error: "Lỗi lấy dữ liệu: " + (err.sqlMessage || err.message) });
        }
        console.log('✅ getAllUsers - tổng số bản ghi trả về:', results.length);
        res.json(results);
    });
};

// 2. Tạo user mới
exports.createUser = (req, res) => {
    const { username, email, password, role } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if(err) return res.status(500).json({ error: "Lỗi mã hóa" });

        db.query("INSERT INTO Accounts (Username, Email, PasswordHash, RoleID) VALUES (?, ?, ?, ?)", 
        [username, email, hash, role], (err) => {
            if (err) return res.status(500).json({ error: "Lỗi thêm user" });
            res.json({ message: "Thêm thành công!" });
        });
    });
};

// 3. Cập nhật user
exports.updateUser = (req, res) => {
    const { email, role, password } = req.body;
    const id = req.params.id;

    if (password) {
        bcrypt.hash(password, 10, (err, hash) => {
            db.query("UPDATE Accounts SET Email=?, RoleID=?, PasswordHash=? WHERE AccountID=?", [email, role, hash, id], (err) => {
                if(err) return res.status(500).json({ error: "Lỗi update" });
                res.json({ message: "Cập nhật thành công!" });
            });
        });
    } else {
        db.query("UPDATE Accounts SET Email=?, RoleID=? WHERE AccountID=?", [email, role, id], (err) => {
            if(err) return res.status(500).json({ error: "Lỗi update" });
            res.json({ message: "Cập nhật thành công!" });
        });
    }
};

// 4. Xóa/Khóa/Mở khóa user
exports.deleteUser = (req, res) => {
    const userId = req.params.id;
    const { action } = req.query; // action: 'lock' hoặc 'unlock', mặc định là 'lock'
    const isUnlock = action === 'unlock';
    
    // 1. Kiểm tra user có tồn tại và lấy RoleID, IsLocked
    db.query("SELECT RoleID, IFNULL(IsLocked, 0) AS IsLocked FROM Accounts WHERE AccountID = ? AND (IsDeleted = 0 OR IsDeleted IS NULL)", [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Lỗi kiểm tra user: " + err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy tài khoản!" });
        }
        
        const userRole = results[0].RoleID;
        const currentLockStatus = results[0].IsLocked;
        
        // 2. Không cho phép xóa/khóa admin (RoleID = 1)
        if (userRole === 1) {
            return res.status(403).json({ error: "Không thể thao tác với tài khoản Admin!" });
        }
        
        // 3. Kiểm tra xem cột IsLocked có tồn tại không
        db.query("SHOW COLUMNS FROM Accounts LIKE 'IsLocked'", (err, columns) => {
            if (err) {
                return res.status(500).json({ error: "Lỗi kiểm tra cột IsLocked: " + err.message });
            }
            
            if (columns.length > 0) {
                // Có cột IsLocked, sử dụng khóa/mở khóa tài khoản
                const newLockStatus = isUnlock ? 0 : 1;
                const actionText = isUnlock ? "mở khóa" : "khóa";
                
                // Kiểm tra trạng thái hiện tại
                if (isUnlock && currentLockStatus === 0) {
                    return res.status(400).json({ error: "Tài khoản này chưa bị khóa!" });
                }
                if (!isUnlock && currentLockStatus === 1) {
                    return res.status(400).json({ error: "Tài khoản này đã bị khóa!" });
                }
                
                const sql = "UPDATE Accounts SET IsLocked = ? WHERE AccountID = ?";
                db.query(sql, [newLockStatus, userId], (err) => {
                    if(err) return res.status(500).json({ error: `Lỗi ${actionText} tài khoản: ` + err.message });
                    res.json({ message: `Đã ${actionText} tài khoản!` });
                });
            } else {
                // Chưa có cột IsLocked, fallback về xóa (soft delete) - chỉ khi khóa
                if (isUnlock) {
                    return res.status(400).json({ 
                        error: "Tính năng mở khóa chưa khả dụng. Vui lòng chạy migration 10_add_islocked_to_accounts.sql" 
                    });
                }
                
                const sql = "UPDATE Accounts SET IsDeleted = 1 WHERE AccountID = ?";
                db.query(sql, [userId], (err) => {
                    if(err) return res.status(500).json({ error: "Lỗi xóa user: " + err.message });
                    res.json({ 
                        message: "Đã xóa tài khoản! (Lưu ý: Vui lòng chạy migration 10_add_islocked_to_accounts.sql để sử dụng tính năng khóa tài khoản)" 
                    });
                });
            }
        });
    });
};