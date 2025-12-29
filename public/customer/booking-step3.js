// ================= KHỞI TẠO =================

let bookingData = {};
let depositData = null;

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadBookingData();
    loadDepositInfo();
    loadRoomDetails();
    formatDates();
    displayRoomType();
    
    // Kiểm tra xem có bookingId trong localStorage không (từ lần đặt phòng trước)
    const bookingId = localStorage.getItem('current_booking_id');
    if (bookingId) {
        // Có booking, kiểm tra trạng thái đặt cọc
        checkDepositStatus(bookingId);
    }
});

// ================= AUTH =================

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const authSection = document.getElementById('auth-section');

    if (!token) {
        alert('Bạn cần đăng nhập để đặt phòng!');
        window.location.href = '../auth/login.html';
        return;
    }

    if (token) {
        authSection.innerHTML = `
            <span class="user-welcome">Xin chào, ${username}</span>
            <a href="history.html" style="color:white; text-decoration:underline; margin-right:15px; font-size:14px; font-weight:bold;">Lịch sử đặt phòng</a>
            <button class="btn-logout" onclick="logout()">Đăng xuất</button>
        `;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// ================= LOAD BOOKING DATA =================

function loadBookingData() {
    // Lấy dữ liệu từ localStorage
    bookingData = {
        roomId: localStorage.getItem('booking_roomId'),
        checkIn: localStorage.getItem('booking_checkIn'),
        checkOut: localStorage.getItem('booking_checkOut'),
        adults: parseInt(localStorage.getItem('booking_adults')) || 2,
        children: parseInt(localStorage.getItem('booking_children')) || 0,
        rooms: parseInt(localStorage.getItem('booking_rooms')) || 1,
        roomTypeId: localStorage.getItem('booking_roomTypeId'),
        roomTypeName: localStorage.getItem('booking_roomTypeName'),
        // Thông tin từ step 1
        lastName: localStorage.getItem('booking_lastName'),
        firstName: localStorage.getItem('booking_firstName'),
        email: localStorage.getItem('booking_email'),
        phone: localStorage.getItem('booking_phone'),
        specialRequests: localStorage.getItem('booking_specialRequests'),
        arrivalTime: localStorage.getItem('booking_arrivalTime')
    };

    console.log('Booking data loaded in step 3:', bookingData);

    if (!bookingData.roomId || !bookingData.checkIn || !bookingData.checkOut) {
        console.error('Thiếu thông tin đặt phòng:', {
            roomId: bookingData.roomId,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut
        });
        alert('Thiếu thông tin đặt phòng! Vui lòng quay lại bước 1.');
        window.location.href = 'booking-step1.html';
        return;
    }
}

// ================= LOAD DEPOSIT INFO =================

function loadDepositInfo() {
    // Lấy thông tin đặt cọc từ localStorage (đã được lưu ở step 2)
    const depositStr = localStorage.getItem('booking_deposit');
    if (depositStr) {
        try {
            depositData = JSON.parse(depositStr);
            displayDepositInfo(depositData);
        } catch (e) {
            console.error('Lỗi parse deposit data:', e);
        }
    }
}

// ================= LOAD ROOM DETAILS =================

async function loadRoomDetails() {
    try {
        if (!bookingData.roomId) {
            console.error('Thiếu roomId trong bookingData:', bookingData);
            alert('Thiếu thông tin phòng! Vui lòng quay lại bước 1.');
            window.location.href = 'booking-step1.html';
            return;
        }
        
        const res = await fetch(`http://localhost:3000/api/rooms/${bookingData.roomId}`);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${res.status}: Không tìm thấy thông tin phòng`);
        }
        
        const room = await res.json();
        
        if (!room) {
            throw new Error('Không nhận được dữ liệu phòng từ server');
        }
        
        document.getElementById('hotel-name').textContent = room.RoomName || 'N/A';
        document.getElementById('hotel-address').textContent = room.Address || 'N/A';
        
        // Rating
        if (room.AvgRating !== null && room.AvgRating !== undefined) {
            const avgRating = parseFloat(room.AvgRating) || 0;
            document.getElementById('hotel-rating').textContent = 
                `${avgRating.toFixed(1)} Tuyệt vời - ${room.ReviewCount || 0} đánh giá`;
        } else {
            document.getElementById('hotel-rating').textContent = '';
        }
        
        const imgUrl = room.ImageURL || 'https://via.placeholder.com/120x120';
        document.getElementById('hotel-image').src = imgUrl;
        
        // Lưu thông tin phòng vào bookingData
        bookingData.roomName = room.RoomName;
        bookingData.roomImage = imgUrl;
        
        // Nếu có roomTypeId, load thông tin loại phòng để lấy giá
        if (bookingData.roomTypeId) {
            await loadRoomTypePrice();
        } else {
            // Nếu không có roomTypeId, dùng giá mặc định từ room
            bookingData.roomPrice = room.Price || 1000000;
            calculatePrice();
        }
        
    } catch (err) {
        console.error('Lỗi tải thông tin phòng:', err);
        console.error('bookingData:', bookingData);
        alert(`Lỗi tải thông tin phòng: ${err.message || 'Vui lòng thử lại sau!'}`);
    }
}

async function loadRoomTypePrice() {
    try {
        const res = await fetch(`http://localhost:3000/api/roomtypes/${bookingData.roomTypeId}`);
        if (!res.ok) throw new Error('Không tìm thấy loại phòng');
        
        const roomType = await res.json();
        
        // Lưu giá từ loại phòng
        bookingData.roomPrice = roomType.Price;
        bookingData.roomTypePrice = roomType.Price;
        
        // Tính giá sau khi có thông tin loại phòng
        calculatePrice();
        
    } catch (err) {
        console.error('Lỗi tải thông tin loại phòng:', err);
        // Nếu không load được room type, dùng giá mặc định
        const res = await fetch(`http://localhost:3000/api/rooms/${bookingData.roomId}`);
        if (res.ok) {
            const room = await res.json();
            bookingData.roomPrice = room.Price;
        } else {
            bookingData.roomPrice = 1000000; // Giá mặc định
        }
        calculatePrice();
    }
}

function formatDates() {
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    
    const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    const formatDate = (date) => {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const months = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 
                       'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
    };
    
    document.getElementById('summary-checkin').textContent = formatDate(checkIn);
    document.getElementById('summary-checkout').textContent = formatDate(checkOut);
    document.getElementById('summary-duration').textContent = `${days} đêm`;
}

function calculatePrice() {
    // Giả sử giá mỗi đêm từ roomData hoặc bookingData
    const pricePerNight = parseFloat(bookingData.roomPrice) || 1000000;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    const basePrice = pricePerNight * nights * bookingData.rooms;
    const tax = basePrice * 0.08; // 8% VAT
    const total = basePrice + tax;
    
    // Hiển thị giá
    document.getElementById('original-price').textContent = formatCurrency(basePrice);
    document.getElementById('total-price').textContent = formatCurrency(total);
    document.getElementById('tax-amount').textContent = formatCurrency(tax);
    
    // Lưu giá vào bookingData
    bookingData.basePrice = basePrice;
    bookingData.tax = tax;
    bookingData.total = total;
    bookingData.nights = nights;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
}

function displayRoomType() {
    // Hiển thị tên loại phòng nếu có
    if (bookingData.roomTypeName) {
        document.getElementById('summary-room-type').textContent = bookingData.roomTypeName;
        document.getElementById('room-type-item').style.display = 'flex';
    }
}

// ================= DEPOSIT FUNCTIONS =================

async function checkDepositStatus(bookingId) {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/bookings/my-bookings`, {
            headers: {
                'Authorization': token
            }
        });
        
        if (!res.ok) throw new Error('Không tải được thông tin booking');
        
        const bookings = await res.json();
        const booking = bookings.find(b => b.BookingID == bookingId);
        
        if (booking && booking.DepositAmount && booking.DepositAmount > 0) {
            const deposit = {
                amount: booking.DepositAmount,
                status: booking.DepositStatus || 'pending',
                info: booking.DepositInfo ? (typeof booking.DepositInfo === 'string' ? JSON.parse(booking.DepositInfo) : booking.DepositInfo) : null
            };
            
            displayDepositInfo(deposit);
            
            if (deposit.status === 'confirmed') {
                document.getElementById('deposit-status-confirmed').style.display = 'block';
                document.getElementById('btn-confirm-deposit').style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Lỗi kiểm tra trạng thái đặt cọc:', err);
    }
}

function displayDepositInfo(deposit) {
    // Hiển thị số tiền đặt cọc
    console.log('Hiển thị tiền cọc:', deposit.amount);
    document.getElementById('deposit-amount').textContent = formatCurrency(deposit.amount);
    
    // Hiển thị thông tin chuyển khoản
    if (deposit.info) {
        document.getElementById('deposit-account-number').textContent = deposit.info.accountNumber || 'N/A';
        document.getElementById('deposit-bank-name').textContent = deposit.info.bankName || 'N/A';
        document.getElementById('deposit-account-name').textContent = deposit.info.accountName || 'N/A';
        document.getElementById('deposit-content').textContent = deposit.info.content || 'N/A';
    }
    
    // Nếu đã xác nhận, hiển thị trạng thái
    if (deposit.status === 'confirmed') {
        document.getElementById('deposit-status-confirmed').style.display = 'block';
        document.getElementById('btn-confirm-deposit').style.display = 'none';
    }
}

function confirmDeposit() {
    const bookingId = localStorage.getItem('current_booking_id');
    
    if (!bookingId) {
        alert('Không tìm thấy thông tin đặt phòng!');
        return;
    }
    
    const btn = document.getElementById('btn-confirm-deposit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    
    const token = localStorage.getItem('token');
    
    // Gửi request xác nhận đặt cọc
    fetch(`http://localhost:3000/api/bookings/${bookingId}/confirm-deposit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert('❌ ' + data.error);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Tôi đã chuyển khoản xong';
        } else {
            // Hiển thị trạng thái đã xác nhận
            document.getElementById('deposit-status-confirmed').style.display = 'block';
            document.getElementById('btn-confirm-deposit').style.display = 'none';
            
            // Xóa dữ liệu booking trong localStorage
            Object.keys(bookingData).forEach(key => {
                localStorage.removeItem(`booking_${key}`);
            });
            localStorage.removeItem('current_booking_id');
            localStorage.removeItem('booking_deposit');
            
            alert('✅ ' + data.message);
            
            // Chuyển đến history sau 2 giây
            setTimeout(() => {
                window.location.href = 'history.html';
            }, 2000);
        }
    })
    .catch(err => {
        console.error(err);
        alert('Lỗi kết nối Server!');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Tôi đã chuyển khoản xong';
    });
}

