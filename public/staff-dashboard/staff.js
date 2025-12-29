const API_URL = "http://localhost:3000/api/staff";
const token = localStorage.getItem('token');

// Kiểm tra quyền Staff
if (!token || localStorage.getItem('role') != 3) {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "../auth/login.html";
}

// Hàm fetch có xác thực
async function fetchWithAuth(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token
    };
    return fetch(`${API_URL}${endpoint}`, { ...options, headers });
}

let currentHotelId = null;
let allBookings = [];

// Load danh sách khách sạn khi trang load
document.addEventListener("DOMContentLoaded", () => {
    loadHotels();
    document.getElementById('staff-name').textContent = localStorage.getItem('username') || 'Nhân viên';
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        window.location.href = "../auth/login.html";
    });
});

// Load danh sách khách sạn được phân công
async function loadHotels() {
    try {
        const res = await fetchWithAuth('/hotels');
        if (!res.ok) throw new Error('Lỗi tải danh sách khách sạn');
        const hotels = await res.json();
        renderHotels(hotels);
    } catch (err) {
        console.error(err);
        document.getElementById('hotels-list').innerHTML = 
            '<p style="color:#dc3545;">Lỗi tải danh sách khách sạn!</p>';
    }
}

function renderHotels(hotels) {
    const container = document.getElementById('hotels-list');
    if (!hotels || hotels.length === 0) {
        container.innerHTML = '<p>Bạn chưa được phân công quản lý khách sạn nào.</p>';
        return;
    }
    
    container.innerHTML = hotels.map(hotel => `
        <div class="hotel-card" onclick="viewHotelBookings(${hotel.HotelID}, '${hotel.HotelName}')">
            ${hotel.ImageURL ? `<img src="${hotel.ImageURL}" alt="${hotel.HotelName}">` : ''}
            <h3>${hotel.HotelName}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${hotel.Address || 'Chưa có địa chỉ'}</p>
        </div>
    `).join('');
}

// Xem danh sách booking của khách sạn
function viewHotelBookings(hotelId, hotelName) {
    currentHotelId = hotelId;
    document.getElementById('hotel-name-display').textContent = `Đặt phòng - ${hotelName}`;
    
    // Chuyển sang section bookings
    document.getElementById('section-hotels').classList.remove('active-section');
    document.getElementById('section-bookings').classList.add('active-section');
    document.getElementById('section-title').textContent = 'Quản lý Đặt phòng';
    
    loadBookings();
}

// Quay lại danh sách khách sạn
function backToHotels() {
    currentHotelId = null;
    document.getElementById('section-bookings').classList.remove('active-section');
    document.getElementById('section-hotels').classList.add('active-section');
    document.getElementById('section-title').textContent = 'Khách sạn của tôi';
}

// Load danh sách booking
async function loadBookings() {
    if (!currentHotelId) return;
    
    try {
        const status = document.getElementById('booking-status-filter').value;
        const checkIn = document.getElementById('checkin-filter').value;
        const checkOut = document.getElementById('checkout-filter').value;
        
        let url = `/hotels/${currentHotelId}/bookings?`;
        if (status !== 'all') url += `status=${status}&`;
        if (checkIn) url += `checkIn=${checkIn}&`;
        if (checkOut) url += `checkOut=${checkOut}&`;
        
        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error('Lỗi tải danh sách đặt phòng');
        allBookings = await res.json();
        renderBookings(allBookings);
    } catch (err) {
        console.error(err);
        document.getElementById('bookings-table-body').innerHTML = 
            '<tr><td colspan="9" style="text-align:center;color:#dc3545;">Lỗi tải dữ liệu!</td></tr>';
    }
}

function renderBookings(bookings) {
    const tbody = document.getElementById('bookings-table-body');
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Chưa có đặt phòng nào</td></tr>';
        return;
    }
    
    tbody.innerHTML = bookings.map(bk => {
        const checkIn = new Date(bk.CheckInDate);
        const checkOut = new Date(bk.CheckOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        const statusLabels = {
            'Pending': 'Chờ duyệt',
            'Confirmed': 'Đã xác nhận',
            'CheckedIn': 'Đang ở',
            'CheckedOut': 'Đã trả phòng',
            'Cancelled': 'Đã hủy'
        };
        
        let actionButtons = '';
        if (bk.Status === 'Pending' || bk.Status === 'Confirmed') {
            actionButtons = `
                <button onclick="checkInBooking(${bk.BookingID})" class="btn btn-success">
                    <i class="fas fa-sign-in-alt"></i> Check-in
                </button>
            `;
        } else if (bk.Status === 'CheckedIn') {
            // Nếu chưa xác nhận check-in, hiển thị nút xác nhận
            if (!bk.CheckInConfirmed) {
                actionButtons = `
                    <button onclick="confirmCheckIn(${bk.BookingID})" class="btn btn-success" style="margin-bottom:5px;">
                        <i class="fas fa-check-circle"></i> Xác nhận Check-in
                    </button>
                    <br>
                `;
            } else {
                actionButtons = `
                    <span class="badge badge-success" style="margin-bottom:5px; display:inline-block;">
                        <i class="fas fa-check"></i> Đã xác nhận Check-in
                    </span>
                    <br>
                `;
            }
            actionButtons += `
                <button onclick="checkOutBooking(${bk.BookingID})" class="btn btn-primary">
                    <i class="fas fa-sign-out-alt"></i> Check-out
                </button>
                <button onclick="revertBookingStatus(${bk.BookingID}, 'Confirmed')" class="btn btn-secondary" style="margin-top:5px;">
                    <i class="fas fa-undo"></i> Quay lại Confirmed
                </button>
            `;
        } else if (bk.Status === 'CheckedOut') {
            // Nếu chưa xác nhận check-out, hiển thị nút xác nhận và kiểm tra phòng
            if (!bk.CheckOutConfirmed) {
                actionButtons = `
                    <button onclick="openConfirmCheckOutModal(${bk.BookingID})" class="btn btn-primary">
                        <i class="fas fa-check-circle"></i> Xác nhận Check-out & Kiểm tra phòng
                    </button>
                `;
            } else {
                actionButtons = `
                    <span class="badge badge-success" style="display:inline-block; margin-bottom:5px;">
                        <i class="fas fa-check"></i> Đã xác nhận Check-out
                    </span>
                `;
            }
        } else if (bk.Status === 'Confirmed') {
            actionButtons = `
                <button onclick="checkInBooking(${bk.BookingID})" class="btn btn-success">
                    <i class="fas fa-sign-in-alt"></i> Check-in
                </button>
                <button onclick="revertBookingStatus(${bk.BookingID}, 'Pending')" class="btn btn-secondary" style="margin-top:5px;">
                    <i class="fas fa-undo"></i> Quay lại Pending
                </button>
            `;
        }
        
        return `
            <tr>
                <td>${bk.BookingID}</td>
                <td>${bk.Username || bk.GuestName || 'N/A'}<br><small>${bk.Email || bk.GuestEmail || ''}</small></td>
                <td>${bk.RoomTypeName || 'N/A'}</td>
                <td>${checkIn.toLocaleDateString('vi-VN')}</td>
                <td>${checkOut.toLocaleDateString('vi-VN')}</td>
                <td>${nights} đêm</td>
                <td>${bk.Adults || 0} người lớn, ${bk.Children || 0} trẻ em<br>${bk.Rooms || 1} phòng</td>
                <td><span class="status-badge status-${bk.Status}">${statusLabels[bk.Status] || bk.Status}</span></td>
                <td>
                    ${actionButtons}
                    <button onclick="viewBookingDetail(${bk.BookingID})" class="btn btn-secondary" style="margin-top:5px;">
                        <i class="fas fa-eye"></i> Chi tiết
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Check-in booking
async function checkInBooking(bookingId) {
    if (!confirm('Xác nhận check-in cho đơn đặt phòng này?')) return;
    
    try {
        const res = await fetchWithAuth(`/bookings/${bookingId}/checkin`, {
            method: 'POST'
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Lỗi check-in');
        }
        
        alert('Check-in thành công!');
        loadBookings();
    } catch (err) {
        alert(err.message);
    }
}

// Check-out booking
async function checkOutBooking(bookingId) {
    if (!confirm('Xác nhận check-out cho đơn đặt phòng này?')) return;
    
    try {
        const res = await fetchWithAuth(`/bookings/${bookingId}/checkout`, {
            method: 'POST'
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Lỗi check-out');
        }
        
        alert('Check-out thành công!');
        loadBookings();
    } catch (err) {
        alert(err.message);
    }
}

// Xem chi tiết booking
async function viewBookingDetail(bookingId) {
    try {
        const res = await fetchWithAuth(`/bookings/${bookingId}`);
        if (!res.ok) throw new Error('Lỗi tải chi tiết');
        const booking = await res.json();
        
        const checkIn = new Date(booking.CheckInDate);
        const checkOut = new Date(booking.CheckOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const pricePerNight = booking.RoomTypePrice || booking.Price || 0;
        const basePrice = pricePerNight * nights * (booking.Rooms || 1);
        const tax = basePrice * 0.08;
        const total = basePrice + tax;
        
        const statusLabels = {
            'Pending': 'Chờ duyệt',
            'Confirmed': 'Đã xác nhận',
            'CheckedIn': 'Đang ở',
            'CheckedOut': 'Đã trả phòng',
            'Cancelled': 'Đã hủy'
        };
        
        document.getElementById('booking-detail-content').innerHTML = `
            <div style="line-height: 1.8;">
                <h4>Thông tin Khách hàng</h4>
                <p><strong>Tên:</strong> ${booking.Username || booking.GuestName || 'N/A'}</p>
                <p><strong>Email:</strong> ${booking.Email || booking.GuestEmail || 'N/A'}</p>
                <p><strong>Điện thoại:</strong> ${booking.GuestPhone || 'N/A'}</p>
                
                <h4 style="margin-top:20px;">Thông tin Đặt phòng</h4>
                <p><strong>Mã đơn:</strong> #${booking.BookingID}</p>
                <p><strong>Khách sạn:</strong> ${booking.RoomName || 'N/A'}</p>
                <p><strong>Loại phòng:</strong> ${booking.RoomTypeName || 'N/A'}</p>
                <p><strong>Check-in:</strong> ${checkIn.toLocaleDateString('vi-VN')}</p>
                <p><strong>Check-out:</strong> ${checkOut.toLocaleDateString('vi-VN')}</p>
                <p><strong>Số đêm:</strong> ${nights} đêm</p>
                <p><strong>Số người:</strong> ${booking.Adults || 0} người lớn, ${booking.Children || 0} trẻ em</p>
                <p><strong>Số phòng:</strong> ${booking.Rooms || 1} phòng</p>
                <p><strong>Trạng thái:</strong> <span class="status-badge status-${booking.Status}">${statusLabels[booking.Status] || booking.Status}</span></p>
                
                <h4 style="margin-top:20px;">Thông tin Thanh toán</h4>
                <p><strong>Giá/đêm:</strong> ${new Intl.NumberFormat('vi-VN').format(pricePerNight)} VNĐ</p>
                <p><strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN').format(basePrice)} VNĐ</p>
                <p><strong>Thuế (8%):</strong> ${new Intl.NumberFormat('vi-VN').format(tax)} VNĐ</p>
                <p><strong><strong>Tổng cộng:</strong> ${new Intl.NumberFormat('vi-VN').format(total)} VNĐ</p>
                
                ${booking.CheckInConfirmed ? `<h4 style="margin-top:20px;">Trạng thái Check-in</h4><p><span class="status-badge" style="background:#28a745; color:white; padding:5px 10px; border-radius:3px;"><i class="fas fa-check-circle"></i> Đã xác nhận Check-in</span></p>` : ''}
                ${booking.CheckOutConfirmed ? `<h4 style="margin-top:20px;">Trạng thái Check-out</h4><p><span class="status-badge" style="background:#28a745; color:white; padding:5px 10px; border-radius:3px;"><i class="fas fa-check-circle"></i> Đã xác nhận Check-out</span></p>` : ''}
                ${booking.RoomInspection ? `<h4 style="margin-top:20px;">Kiểm tra Phòng</h4><p style="background:#f8f9fa; padding:10px; border-radius:5px; border-left:3px solid #007bff;">${booking.RoomInspection}</p>` : ''}
                
                ${booking.SpecialRequests ? `<h4 style="margin-top:20px;">Yêu cầu đặc biệt</h4><p>${booking.SpecialRequests}</p>` : ''}
                ${booking.CancelReason ? `<h4 style="margin-top:20px;">Lý do hủy</h4><p>${booking.CancelReason}</p>` : ''}
            </div>
        `;
        document.getElementById('modal-booking-detail').style.display = 'flex';
    } catch (err) {
        alert('Lỗi tải chi tiết: ' + err.message);
    }
}

// Xác nhận check-in
async function confirmCheckIn(bookingId) {
    if (!confirm('Xác nhận đã check-in cho đơn đặt phòng này?')) return;
    
    try {
        const res = await fetchWithAuth(`/bookings/${bookingId}/confirm-checkin`, {
            method: 'POST'
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Lỗi xác nhận check-in');
        }
        
        alert('Xác nhận check-in thành công!');
        loadBookings();
    } catch (err) {
        alert(err.message);
    }
}

// Mở modal xác nhận check-out
function openConfirmCheckOutModal(bookingId) {
    document.getElementById('confirm-checkout-booking-id').value = bookingId;
    document.getElementById('room-inspection').value = '';
    document.getElementById('modal-confirm-checkout').style.display = 'flex';
}

// Đóng modal xác nhận check-out
function closeConfirmCheckOutModal() {
    document.getElementById('modal-confirm-checkout').style.display = 'none';
    document.getElementById('confirm-checkout-form').reset();
}

// Xác nhận check-out và kiểm tra phòng
document.getElementById('confirm-checkout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookingId = document.getElementById('confirm-checkout-booking-id').value;
    const roomInspection = document.getElementById('room-inspection').value;
    
    if (!roomInspection.trim()) {
        alert('Vui lòng nhập thông tin kiểm tra phòng!');
        return;
    }
    
    try {
        const res = await fetchWithAuth(`/bookings/${bookingId}/confirm-checkout`, {
            method: 'POST',
            body: JSON.stringify({ roomInspection })
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Lỗi xác nhận check-out');
        }
        
        alert('Xác nhận check-out và kiểm tra phòng thành công!');
        closeConfirmCheckOutModal();
        loadBookings();
    } catch (err) {
        alert(err.message);
    }
});

// Quay lại trạng thái booking
async function revertBookingStatus(bookingId, newStatus) {
    const statusLabels = {
        'Pending': 'Chờ duyệt',
        'Confirmed': 'Đã xác nhận',
        'CheckedIn': 'Đang ở'
    };
    
    const confirmMsg = `Bạn muốn QUAY LẠI trạng thái đơn #${bookingId} sang: "${statusLabels[newStatus] || newStatus}"?\n\nLưu ý: Đây là thao tác quay lại trạng thái trước.`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
        const res = await fetchWithAuth(`/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Lỗi quay lại trạng thái');
        }
        
        alert('Quay lại trạng thái thành công!');
        loadBookings();
    } catch (err) {
        alert(err.message);
    }
}

// Đóng modal
document.querySelectorAll(".close-modal").forEach(btn => {
    btn.onclick = function() { this.closest(".modal").style.display = "none"; }
});
window.onclick = function(e) {
    if (e.target.classList.contains("modal")) e.target.style.display = "none";
}

