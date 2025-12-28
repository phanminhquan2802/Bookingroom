document.getElementById('forgot-password-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const messageDiv = document.getElementById('message');
    const submitButton = event.target.querySelector('button[type="submit"]');
    
    // Reset message
    messageDiv.style.display = 'none';
    messageDiv.className = '';
    submitButton.disabled = true;
    submitButton.textContent = 'Đang gửi...';

    try {
        const response = await fetch('http://localhost:3000/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
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
                ${data.message || 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút. Vui lòng kiểm tra hộp thư đến (và cả thư mục Spam).'}
            `;
            
            // Clear form
            document.getElementById('email').value = '';
        } else {
            messageDiv.className = 'error';
            messageDiv.style.backgroundColor = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            messageDiv.innerHTML = `<strong>✗ Lỗi:</strong> ${data.error || 'Không thể gửi email. Vui lòng thử lại sau.'}`;
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
        submitButton.textContent = 'Gửi Email Đặt Lại';
    }
});

