const db = require('../config/db');

// 1. Lấy tất cả danh mục
exports.getAllCategories = (req, res) => {
    // Không dùng IsDeleted vì bảng Categories gốc không có cột này
    const sql = "SELECT CategoryID, CategoryName, Description FROM Categories";
    db.query(sql, (err, results) => {
        if(err) return res.status(500).json({ error: "Lỗi lấy danh mục" });
        res.json(results);
    });
};

// 2. Thêm danh mục mới
exports.createCategory = (req, res) => {
    const { name, description } = req.body;
    db.query("INSERT INTO Categories (CategoryName, Description) VALUES (?, ?)", [name, description], (err) => {
        if(err) return res.status(500).json({ error: "Lỗi thêm danh mục" });
        res.json({ message: "Thêm thành công!" });
    });
};

// 3. Cập nhật danh mục
exports.updateCategory = (req, res) => {
    const { name, description } = req.body;
    db.query("UPDATE Categories SET CategoryName=?, Description=? WHERE CategoryID=?", [name, description, req.params.id], (err) => {
        if(err) return res.status(500).json({ error: "Lỗi update" });
        res.json({ message: "Cập nhật thành công!" });
    });
};

// 4. Xóa danh mục
exports.deleteCategory = (req, res) => {
    // Xóa cứng vì bảng không có cột IsDeleted
    const sql = "DELETE FROM Categories WHERE CategoryID = ?";
    db.query(sql, [req.params.id], (err) => {
        if(err) return res.status(500).json({ error: "Lỗi xóa danh mục" });
        res.json({ message: "Đã xóa danh mục!" });
    });
};