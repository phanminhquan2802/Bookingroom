// Lắng nghe sự kiện khi bấm nút "Đăng Nhập"
document.querySelector('.login-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Ngăn trang web tự load lại

    // 1. Lấy dữ liệu từ ô input
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    // Kiểm tra sơ bộ
    if (!usernameInput || !passwordInput) {
        alert("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
        return;
    }

    // 2. Gửi dữ liệu lên Backend (Node.js)
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput
            })
        });

        const data = await response.json();

        // 3. Xử lý kết quả
        if (response.ok) {

            // Lưu Token và Role vào bộ nhớ trình duyệt
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', data.username);

            // Chuyển hướng dựa trên Role (1: Admin, 2: Guest)
            if (data.role === 1) {
                window.location.href = '../admin-dashboard/admin.html'; // Sửa đường dẫn trang Admin của bạn
            } else {
                window.location.href = '../customer/index.html'; // Sửa đường dẫn trang chủ Khách
            }
        } else {
            // -- Thất bại --
            alert(data.error); // Hiện thông báo lỗi từ Server (ví dụ: "Sai mật khẩu")
        }

    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Không thể kết nối tới Server Backend (kiểm tra xem đã chạy node server.js chưa?)');
    }
});