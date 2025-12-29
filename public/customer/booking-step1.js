// ================= KHỞI TẠO =================

let bookingData = {};

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadBookingData();
    setupFormValidation();
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
    // Lấy dữ liệu từ URL params hoặc localStorage
    const urlParams = new URLSearchParams(window.location.search);
    
    bookingData = {
        roomId: urlParams.get('roomId') || localStorage.getItem('booking_roomId'),
        checkIn: urlParams.get('checkIn') || localStorage.getItem('booking_checkIn'),
        checkOut: urlParams.get('checkOut') || localStorage.getItem('booking_checkOut'),
        adults: parseInt(urlParams.get('adults')) || parseInt(localStorage.getItem('booking_adults')) || 2,
        children: parseInt(urlParams.get('children')) || parseInt(localStorage.getItem('booking_children')) || 0,
        rooms: parseInt(urlParams.get('rooms')) || parseInt(localStorage.getItem('booking_rooms')) || 1,
        roomTypeId: urlParams.get('roomTypeId') || localStorage.getItem('booking_roomTypeId'),
        roomTypeName: urlParams.get('roomTypeName') || localStorage.getItem('booking_roomTypeName')
    };

    // Lưu vào localStorage để dùng ở step 2
    Object.keys(bookingData).forEach(key => {
        if (bookingData[key]) {
            localStorage.setItem(`booking_${key}`, bookingData[key]);
        }
    });

    if (!bookingData.roomId || !bookingData.checkIn || !bookingData.checkOut) {
        alert('Thiếu thông tin đặt phòng! Vui lòng quay lại trang chi tiết phòng.');
        window.location.href = 'index.html';
        return;
    }

    loadRoomDetails();
    formatDates();
    displayRoomType();
}

async function loadRoomDetails() {
    try {
        // Load thông tin hotel/room
        const res = await fetch(`http://localhost:3000/api/rooms/${bookingData.roomId}`);
        if (!res.ok) throw new Error('Không tìm thấy phòng');
        
        const room = await res.json();
        
        // Hiển thị thông tin khách sạn
        document.getElementById('hotel-name').textContent = room.RoomName;
        document.getElementById('hotel-address').textContent = room.Address || 'Chưa có địa chỉ';
        
        const rating = parseFloat(room.AvgRating || 0);
        const reviewCount = room.ReviewCount || 0;
        if (reviewCount > 0) {
            document.getElementById('hotel-rating').textContent = `${rating.toFixed(1)} Tuyệt vời - ${reviewCount} đánh giá`;
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
            bookingData.roomPrice = room.Price;
            calculatePrice();
        }
        
    } catch (err) {
        console.error('Lỗi tải thông tin phòng:', err);
        alert('Lỗi tải thông tin phòng!');
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

// ================= FORM VALIDATION =================

function setupFormValidation() {
    const form = document.getElementById('booking-form');
    const email = document.getElementById('email');
    const confirmEmail = document.getElementById('confirm-email');
    
    // Validate email match
    confirmEmail.addEventListener('blur', () => {
        if (email.value !== confirmEmail.value) {
            confirmEmail.setCustomValidity('Email không khớp!');
        } else {
            confirmEmail.setCustomValidity('');
        }
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (email.value !== confirmEmail.value) {
            alert('Email xác nhận không khớp!');
            return;
        }
        
        // Lấy dữ liệu form
        const formData = {
            lastName: document.getElementById('last-name').value,
            firstName: document.getElementById('first-name').value,
            email: email.value,
            phone: document.getElementById('country-code').value + document.getElementById('phone').value,
            specialRequests: document.getElementById('special-requests').value
        };
        
        // Lưu vào bookingData và localStorage
        Object.assign(bookingData, formData);
        Object.keys(formData).forEach(key => {
            localStorage.setItem(`booking_${key}`, formData[key]);
        });
        
        // Chuyển sang step 2
        const params = new URLSearchParams({
            roomId: bookingData.roomId,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            adults: bookingData.adults,
            children: bookingData.children,
            rooms: bookingData.rooms
        });
        
        window.location.href = `booking-step2.html?${params.toString()}`;
    });
}

