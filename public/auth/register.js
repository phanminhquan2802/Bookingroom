document.getElementById('register-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Chặn load lại trang

    // 1. Lấy dữ liệu
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    // 2. Kiểm tra mật khẩu nhập lại
    if (password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
    }

    // 3. Gửi lên Server
    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message); // "Đăng ký thành công!"
            window.location.href = 'login.html'; // Chuyển về trang đăng nhập
        } else {
            alert(data.error); // Ví dụ: "Tên đăng nhập đã tồn tại"
        }

    } catch (error) {
        console.error("Lỗi:", error);
        alert("Không kết nối được tới Server!");
    }
});