// Lấy token từ URL parameter
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    // Nếu không có token, hiển thị thông báo lỗi
    document.querySelector('.login-form').innerHTML = `
        <h2>Lỗi</h2>
        <div style="background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #f5c6cb;">
            <strong>✗ Token không hợp lệ!</strong><br>
            Link đặt lại mật khẩu không đúng hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.
        </div>
        <p class="footer-text">
            <a href="forgot-password.html">Yêu cầu đặt lại mật khẩu mới</a>
        </p>
        <p class="footer-text">
            <a href="login.html">Quay lại trang đăng nhập</a>
        </p>
    `;
} else {
    // Đặt token vào hidden input
    document.getElementById('reset-token').value = token;

    // Xử lý form submit
    document.getElementById('reset-password-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const messageDiv = document.getElementById('message');
        const submitButton = event.target.querySelector('button[type="submit"]');
        
        // Kiểm tra mật khẩu xác nhận
        if (newPassword !== confirmPassword) {
            messageDiv.style.display = 'block';
            messageDiv.className = 'error';
            messageDiv.style.backgroundColor = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            messageDiv.innerHTML = '<strong>✗ Lỗi:</strong> Mật khẩu xác nhận không khớp!';
            return;
        }

        // Kiểm tra độ dài mật khẩu
        if (newPassword.length < 6) {
            messageDiv.style.display = 'block';
            messageDiv.className = 'error';
            messageDiv.style.backgroundColor = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            messageDiv.innerHTML = '<strong>✗ Lỗi:</strong> Mật khẩu phải có ít nhất 6 ký tự!';
            return;
        }

        // Reset message
        messageDiv.style.display = 'none';
        messageDiv.className = '';
        submitButton.disabled = true;
        submitButton.textContent = 'Đang xử lý...';

        try {
            const response = await fetch('http://localhost:3000/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    token: token,
                    newPassword: newPassword 
                })
            });

            const data = await response.json();

            messageDiv.style.display = 'block';
            
            if (response.ok) {
                messageDiv.className = 'success';
                messageDiv.style.backgroundColor = '#d4edda';
                messageDiv.style.color = '#155724';
                messageDiv.style.border = '1px solid #c3e6cb';
                messageDiv.innerHTML = `
                    <strong>✓ Thành công!</strong><br>
                    ${data.message || 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập với mật khẩu mới.'}
                `;
                
                // Clear form
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                
                // Chuyển về trang đăng nhập sau 3 giây
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                messageDiv.className = 'error';
                messageDiv.style.backgroundColor = '#f8d7da';
                messageDiv.style.color = '#721c24';
                messageDiv.style.border = '1px solid #f5c6cb';
                messageDiv.innerHTML = `<strong>✗ Lỗi:</strong> ${data.error || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'}`;
            }

        } catch (error) {
            console.error("Lỗi:", error);
            messageDiv.style.display = 'block';
            messageDiv.className = 'error';
            messageDiv.style.backgroundColor = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            messageDiv.innerHTML = '<strong>✗ Lỗi:</strong> Không kết nối được tới Server!';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Đặt Lại Mật Khẩu';
        }
    });
}

