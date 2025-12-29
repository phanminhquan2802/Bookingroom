const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 1. Lấy danh sách tất cả nhân viên
exports.getAllStaff = (req, res) => {
    db.query(
        `SELECT A.AccountID, A.Username, A.Email, A.CreatedAt,
                IFNULL(A.IsDeleted, 0) AS IsDeleted,
                IFNULL(A.IsLocked, 0) AS IsLocked,
                GROUP_CONCAT(DISTINCT CONCAT(R.RoomID, ':', R.RoomName) SEPARATOR '|') as AssignedHotels
         FROM Accounts A
         LEFT JOIN StaffHotels SH ON A.AccountID = SH.StaffID AND SH.IsActive = 1
         LEFT JOIN Rooms R ON SH.HotelID = R.RoomID
         WHERE A.RoleID = 3
         AND (A.IsDeleted = 0 OR A.IsDeleted IS NULL)
         GROUP BY A.AccountID
         ORDER BY A.CreatedAt DESC`,
        (err, results) => {
            if (err) {
                console.error('Lỗi lấy danh sách nhân viên:', err);
                return res.status(500).json({ error: "Lỗi lấy danh sách nhân viên" });
            }
            res.json(results);
        }
    );
};

// 2. Tạo nhân viên mới
exports.createStaff = (req, res) => {
    const { username, email, password } = req.body;
    const adminId = req.user.id;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Thiếu thông tin! Vui lòng cung cấp username, email, password" });
    }
    
    // Kiểm tra username đã tồn tại chưa
    db.query(
        `SELECT AccountID FROM Accounts WHERE Username = ?`,
        [username],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Lỗi kiểm tra username" });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ error: "Username đã tồn tại!" });
            }
            
            // Kiểm tra email đã tồn tại chưa
            db.query(
                `SELECT AccountID FROM Accounts WHERE Email = ?`,
                [email],
                (err2, results2) => {
                    if (err2) {
                        return res.status(500).json({ error: "Lỗi kiểm tra email" });
                    }
                    
                    if (results2.length > 0) {
                        return res.status(400).json({ error: "Email đã tồn tại!" });
                    }
                    
                    // Tạo tài khoản nhân viên (RoleID = 3)
                    bcrypt.hash(password, 10, (err3, hash) => {
                        if (err3) {
                            return res.status(500).json({ error: "Lỗi mã hóa mật khẩu" });
                        }
                        
                        db.query(
                            `INSERT INTO Accounts (Username, Email, PasswordHash, RoleID) VALUES (?, ?, ?, 3)`,
                            [username, email, hash],
                            (err4, result) => {
                                if (err4) {
                                    return res.status(500).json({ error: "Lỗi tạo tài khoản nhân viên" });
                                }
                                
                                res.json({ 
                                    message: "Tạo nhân viên thành công!",
                                    staffId: result.insertId
                                });
                            }
                        );
                    });
                }
            );
        }
    );
};

// 3. Phân công nhân viên quản lý khách sạn
exports.assignHotelToStaff = (req, res) => {
    const { staffId, hotelId } = req.body;
    const adminId = req.user.id;
    
    if (!staffId || !hotelId) {
        return res.status(400).json({ error: "Thiếu thông tin! Vui lòng cung cấp staffId và hotelId" });
    }
    
    // Kiểm tra nhân viên có tồn tại và là staff không
    db.query(
        `SELECT AccountID, RoleID FROM Accounts WHERE AccountID = ? AND RoleID = 3`,
        [staffId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Lỗi kiểm tra nhân viên" });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: "Không tìm thấy nhân viên!" });
            }
            
            // Kiểm tra khách sạn có tồn tại không
            db.query(
                `SELECT RoomID FROM Rooms WHERE RoomID = ? AND (IsDeleted = 0 OR IsDeleted IS NULL)`,
                [hotelId],
                (err2, results2) => {
                    if (err2) {
                        return res.status(500).json({ error: "Lỗi kiểm tra khách sạn" });
                    }
                    
                    if (results2.length === 0) {
                        return res.status(404).json({ error: "Không tìm thấy khách sạn!" });
                    }
                    
                    // Kiểm tra đã được phân công chưa (IsActive = 1)
                    db.query(
                        `SELECT StaffHotelID FROM StaffHotels 
                         WHERE StaffID = ? AND HotelID = ? AND IsActive = 1`,
                        [staffId, hotelId],
                        (err3, results3) => {
                            if (err3) {
                                return res.status(500).json({ error: "Lỗi kiểm tra phân công" });
                            }
                            
                            if (results3.length > 0) {
                                return res.status(400).json({ error: "Nhân viên đã được phân công quản lý khách sạn này!" });
                            }
                            
                            // Gỡ phân công cũ nếu có (IsActive = 0)
                            db.query(
                                `UPDATE StaffHotels SET IsActive = 0 
                                 WHERE StaffID = ? AND HotelID = ? AND IsActive = 1`,
                                [staffId, hotelId],
                                (err4) => {
                                    // Bỏ qua lỗi nếu không có record cũ
                                    
                                    // Tạo phân công mới
                                    db.query(
                                        `INSERT INTO StaffHotels (StaffID, HotelID, AssignedBy) VALUES (?, ?, ?)`,
                                        [staffId, hotelId, adminId],
                                        (err5, result) => {
                                            if (err5) {
                                                // Nếu lỗi do duplicate, thử update lại IsActive = 1
                                                if (err5.code === 'ER_DUP_ENTRY' || err5.errno === 1062) {
                                                    db.query(
                                                        `UPDATE StaffHotels SET IsActive = 1, AssignedBy = ? 
                                                         WHERE StaffID = ? AND HotelID = ?`,
                                                        [adminId, staffId, hotelId],
                                                        (err6) => {
                                                            if (err6) {
                                                                return res.status(500).json({ error: "Lỗi phân công khách sạn" });
                                                            }
                                                            res.json({ message: "Phân công khách sạn thành công!" });
                                                        }
                                                    );
                                                } else {
                                                    return res.status(500).json({ error: "Lỗi phân công khách sạn" });
                                                }
                                            } else {
                                                res.json({ message: "Phân công khách sạn thành công!" });
                                            }
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};

// 4. Gỡ phân công nhân viên khỏi khách sạn
exports.removeHotelFromStaff = (req, res) => {
    const { staffId, hotelId } = req.body;
    
    if (!staffId || !hotelId) {
        return res.status(400).json({ error: "Thiếu thông tin! Vui lòng cung cấp staffId và hotelId" });
    }
    
    db.query(
        `UPDATE StaffHotels SET IsActive = 0 
         WHERE StaffID = ? AND HotelID = ? AND IsActive = 1`,
        [staffId, hotelId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Lỗi gỡ phân công" });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Không tìm thấy phân công này!" });
            }
            
            res.json({ message: "Gỡ phân công thành công!" });
        }
    );
};

// 5. Lấy danh sách khách sạn được phân công cho nhân viên
exports.getStaffHotels = (req, res) => {
    const staffId = req.params.staffId;
    
    db.query(
        `SELECT R.RoomID as HotelID, R.RoomName as HotelName, R.Address, R.ImageURL,
                SH.AssignedAt, SH.AssignedBy,
                A.Username as AssignedByUsername
         FROM StaffHotels SH
         JOIN Rooms R ON SH.HotelID = R.RoomID
         LEFT JOIN Accounts A ON SH.AssignedBy = A.AccountID
         WHERE SH.StaffID = ? AND SH.IsActive = 1
         AND (R.IsDeleted = 0 OR R.IsDeleted IS NULL)
         ORDER BY SH.AssignedAt DESC`,
        [staffId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Lỗi lấy danh sách khách sạn" });
            }
            res.json(results);
        }
    );
};

