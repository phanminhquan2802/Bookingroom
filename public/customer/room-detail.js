// ================= KHỞI TẠO =================

let roomData = null;
let detailMap = null;
let popupMap = null;

// Lấy roomId từ URL
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('id');

if (!roomId) {
    alert('Không tìm thấy ID phòng!');
    window.location.href = 'index.html';
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadRoomDetail();
    initDefaultDates();
    
    // Nếu có ngày trong URL, tự động load các loại phòng
    const urlParams = new URLSearchParams(window.location.search);
    const checkIn = urlParams.get('checkIn');
    const checkOut = urlParams.get('checkOut');
    if (checkIn && checkOut) {
        document.getElementById('checkin-detail').value = checkIn;
        document.getElementById('checkout-detail').value = checkOut;
        // Đợi một chút để roomData được load xong
        setTimeout(() => {
            loadRoomTypes();
        }, 500);
    } else {
        // Load các loại phòng ngay khi trang load
        loadRoomTypes();
    }
});

// ================= AUTH =================

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const authSection = document.getElementById('auth-section');

    if (token) {
        authSection.innerHTML = `
            <span class="user-welcome">Xin chào, ${username}</span>
            <a href="history.html" style="color:white; text-decoration:underline; margin-right:15px; font-size:14px; font-weight:bold;">Lịch sử đặt phòng</a>
            <button class="btn-logout" onclick="logout()">Đăng xuất</button>
        `;
    } else {
        authSection.innerHTML = `
            <a href="../auth/register.html" class="btn-register">Đăng ký</a>
            <a href="../auth/login.html" class="btn-login">Đăng nhập</a>
        `;
    }
}

function logout() {
    localStorage.clear();
    window.location.reload();
}

// ================= LOAD ROOM DETAIL =================

async function loadRoomDetail() {
    try {
        const res = await fetch(`http://localhost:3000/api/rooms/${roomId}`);
        if (!res.ok) {
            throw new Error('Không tìm thấy phòng');
        }
        
        roomData = await res.json();
        renderRoomDetail(roomData);
        loadReviews();
    } catch (err) {
        console.error(err);
        alert('Lỗi tải thông tin phòng: ' + err.message);
        window.location.href = 'index.html';
    }
}

function renderRoomDetail(room) {
    // Header
    document.getElementById('room-name').textContent = room.RoomName;
    document.getElementById('breadcrumb-room-name').textContent = room.RoomName;
    
    // Address
    const addressEl = document.getElementById('room-address');
    if (room.Address) {
        addressEl.textContent = room.Address;
        document.getElementById('room-address-full').textContent = room.Address;
        
        // Show map button if has coordinates
        if (room.Latitude && room.Longitude && room.Latitude !== 0 && room.Longitude !== 0) {
            document.getElementById('btn-show-map').style.display = 'inline-block';
            initLocationMap(room.Latitude, room.Longitude, room.RoomName);
        }
    } else {
        addressEl.textContent = 'Chưa có địa chỉ';
    }
    
    // Rating
    const rating = parseFloat(room.AvgRating || 0);
    const reviewCount = room.ReviewCount || 0;
    
    if (reviewCount > 0) {
        document.getElementById('room-rating-section').style.display = 'flex';
        document.getElementById('rating-badge').textContent = rating.toFixed(1);
        document.getElementById('rating-count').textContent = `${reviewCount} đánh giá`;
        
        let label = 'Trung bình';
        if (rating >= 9.5) label = 'Trên cả tuyệt vời';
        else if (rating >= 9.0) label = 'Xuất sắc';
        else if (rating >= 8.0) label = 'Tuyệt vời';
        else if (rating >= 7.0) label = 'Tốt';
        else if (rating >= 5.0) label = 'Hài lòng';
        
        document.getElementById('rating-label').textContent = label;
    }
    
    // Category
    const categoryEl = document.getElementById('room-category');
    if (room.CategoryName) {
        categoryEl.textContent = room.CategoryName;
    } else {
        categoryEl.textContent = 'Chưa có thông tin';
    }
    
    // Description
    const descriptionEl = document.getElementById('room-description');
    if (room.Description && room.Description.trim()) {
        descriptionEl.textContent = room.Description;
    } else {
        descriptionEl.textContent = 'Chưa có mô tả.';
    }
    
    // Images
    const mainImage = document.getElementById('main-image');
    const imgUrl = room.ImageURL || 'https://via.placeholder.com/1200x500';
    mainImage.src = imgUrl;
    mainImage.alt = room.RoomName;
    
    // Amenities (mặc định, có thể mở rộng)
    const amenities = [
        { icon: 'fas fa-wifi', text: 'WiFi miễn phí' },
        { icon: 'fas fa-snowflake', text: 'Điều hòa không khí' },
        { icon: 'fas fa-tv', text: 'TV màn hình phẳng' },
        { icon: 'fas fa-bath', text: 'Phòng tắm riêng' },
        { icon: 'fas fa-bed', text: 'Giường đôi' },
        { icon: 'fas fa-utensils', text: 'Bếp' },
    ];
    
    const amenitiesGrid = document.getElementById('amenities-grid');
    amenitiesGrid.innerHTML = amenities.map(amenity => `
        <div class="amenity-item">
            <i class="${amenity.icon}"></i>
            <span>${amenity.text}</span>
        </div>
    `).join('');
}


// ================= TABS =================

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Load content if needed
    if (tabName === 'location' && !detailMap && roomData) {
        if (roomData.Latitude && roomData.Longitude && roomData.Latitude !== 0 && roomData.Longitude !== 0) {
            initDetailMap(roomData.Latitude, roomData.Longitude, roomData.RoomName);
        }
    }
}

// ================= MAP =================

function initLocationMap(lat, lng, name) {
    document.getElementById('btn-show-map').onclick = () => {
        showMapModal(lat, lng, name);
    };
}

function initDetailMap(lat, lng, name) {
    const mapEl = document.getElementById('map-container');
    if (!mapEl || typeof L === 'undefined') return;
    
    detailMap = L.map('map-container');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(detailMap);
    
    detailMap.setView([lat, lng], 16);
    L.marker([lat, lng])
        .addTo(detailMap)
        .bindPopup(`<b>${name}</b>`)
        .openPopup();
}

function showMapModal(lat, lng, name) {
    const modal = document.getElementById('map-modal');
    modal.style.display = 'flex';
    
    if (!popupMap) {
        popupMap = L.map('popup-map');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(popupMap);
    }
    
    popupMap.setView([lat, lng], 16);
    popupMap.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            popupMap.removeLayer(layer);
        }
    });
    L.marker([lat, lng])
        .addTo(popupMap)
        .bindPopup(`<b>${name}</b>`)
        .openPopup();
    
    setTimeout(() => { popupMap.invalidateSize(); }, 200);
}

// ================= REVIEWS =================

async function loadReviews() {
    try {
        const res = await fetch(`http://localhost:3000/api/reviews/${roomId}`);
        const reviews = await res.json();
        
        const reviewsSection = document.getElementById('reviews-section');
        
        if (reviews.length === 0) {
            reviewsSection.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">Chưa có đánh giá nào.</p>';
            return;
        }
        
        reviewsSection.innerHTML = reviews.map(review => {
            const date = new Date(review.CreatedAt).toLocaleDateString('vi-VN');
            return `
                <div class="review-item">
                    <div class="review-header">
                        <div class="review-user">
                            <i class="fas fa-user-circle" style="color:#666; margin-right: 5px;"></i>
                            ${review.Username}
                        </div>
                        <div class="review-rating">${review.Rating}/10</div>
                    </div>
                    <div class="review-text">"${review.Comment}"</div>
                    <div class="review-date">Đăng ngày: ${date}</div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Lỗi tải đánh giá:', err);
        document.getElementById('reviews-section').innerHTML = '<p style="color: red;">Lỗi tải đánh giá!</p>';
    }
}

// ================= ROOM TYPES =================

function initDefaultDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const checkInInput = document.getElementById('checkin-detail');
    const checkOutInput = document.getElementById('checkout-detail');
    
    checkInInput.value = formatDate(today);
    checkOutInput.value = formatDate(tomorrow);
    
    // Thêm event listener để tự động reload khi thay đổi ngày
    checkInInput.addEventListener('change', () => {
        // Cập nhật min date của checkout
        const selectedCheckIn = new Date(checkInInput.value);
        const minCheckOut = new Date(selectedCheckIn);
        minCheckOut.setDate(minCheckOut.getDate() + 1);
        checkOutInput.min = formatDate(minCheckOut);
        
        // Nếu checkout < checkin + 1, tự động cập nhật checkout
        if (checkOutInput.value && new Date(checkOutInput.value) <= selectedCheckIn) {
            checkOutInput.value = formatDate(minCheckOut);
        }
        
        // Tự động reload danh sách phòng
        if (checkInInput.value && checkOutInput.value) {
            console.log('Check-in changed, reloading room types...');
            loadRoomTypes();
        }
    });
    
    checkOutInput.addEventListener('change', () => {
        // Tự động reload danh sách phòng
        if (checkInInput.value && checkOutInput.value) {
            console.log('Check-out changed, reloading room types...');
            loadRoomTypes();
        }
    });
    
    // Set min date cho checkout
    const minCheckOut = new Date(tomorrow);
    checkOutInput.min = formatDate(minCheckOut);
}

function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    
    return [year, month, day].join('-');
}

async function loadRoomTypes() {
    if (!roomId) {
        console.error('RoomID không tồn tại');
        return;
    }
    
    const checkIn = document.getElementById('checkin-detail').value;
    const checkOut = document.getElementById('checkout-detail').value;
    
    console.log('loadRoomTypes called with:', { checkIn, checkOut });
    
    // Nếu không có ngày, vẫn load RoomTypes (không filter theo ngày)
    // Chỉ validate nếu có ngày
    if (checkIn && checkOut) {
        if (new Date(checkIn) >= new Date(checkOut)) {
            alert('Ngày trả phòng phải sau ngày nhận phòng!');
            return;
        }
    }
    
    try {
        // Hiển thị loading
        const roomTypesListEl = document.getElementById('room-types-list');
        roomTypesListEl.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Đang tải các loại phòng...</p>';
        
        // Lấy thông tin số người và phòng từ URL params (chỉ khi có từ search)
        const urlParams = new URLSearchParams(window.location.search);
        const adults = urlParams.get('adults');
        const children = urlParams.get('children');
        const rooms = urlParams.get('rooms');
        
        // Chỉ gửi filter nếu có thông tin từ URL (tức là từ trang search)
        // Nếu không có, hiển thị tất cả RoomTypes của hotel này
        let url = `http://localhost:3000/api/hotels/${roomId}/roomtypes`;
        const queryParams = [];
        
        if (checkIn && checkOut) {
            queryParams.push(`checkIn=${checkIn}`, `checkOut=${checkOut}`);
        }
        
        // Chỉ thêm filter số người/phòng nếu có từ URL params (từ trang search)
        if (adults && children && rooms) {
            queryParams.push(`adults=${adults}`, `children=${children}`, `rooms=${rooms}`);
        }
        
        if (queryParams.length > 0) {
            url += '?' + queryParams.join('&');
        }
        
        console.log('Fetching URL:', url);
        
        const res = await fetch(url);
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
            throw new Error(errorData.error || `HTTP ${res.status}`);
        }
        
        const roomTypes = await res.json();
        
        // Debug: Log dữ liệu nhận được
        console.log('Room types received:', roomTypes);
        if (checkIn && checkOut && Array.isArray(roomTypes) && roomTypes.length > 0) {
            console.log('Sample room type data:', {
                RoomTypeID: roomTypes[0].RoomTypeID,
                RoomTypeName: roomTypes[0].RoomTypeName,
                AvailableRooms: roomTypes[0].AvailableRooms,
                ActualAvailableRooms: roomTypes[0].ActualAvailableRooms
            });
        }
        
        // Kiểm tra nếu có hint về migration
        if (roomTypes.error && roomTypes.hint) {
            roomTypesListEl.innerHTML = `
                <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; text-align: center;">
                    <p style="color: #856404; margin-bottom: 10px;"><strong>⚠️ ${roomTypes.error}</strong></p>
                    <p style="color: #856404; font-size: 14px;">${roomTypes.hint}</p>
                </div>
            `;
            return;
        }
        
        if (!Array.isArray(roomTypes) || roomTypes.length === 0) {
            roomTypesListEl.innerHTML = `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                    <p style="color: #666; margin-bottom: 10px;">Không có loại phòng nào cho khách sạn này.</p>
                    <p style="color: #999; font-size: 14px;">Vui lòng chạy file migration: migrations/07_insert_room_types_sample.sql</p>
                </div>
            `;
            return;
        }
        
        // Load tiện nghi cho từng loại phòng
        const roomTypesWithAmenities = await Promise.all(
            roomTypes.map(async (roomType) => {
                try {
                    const amenitiesRes = await fetch(`http://localhost:3000/api/roomtypes/${roomType.RoomTypeID}/amenities`);
                    if (amenitiesRes.ok) {
                        const amenities = await amenitiesRes.json();
                        return { ...roomType, amenities: Array.isArray(amenities) ? amenities : [] };
                    } else {
                        return { ...roomType, amenities: [] };
                    }
                } catch (err) {
                    console.error('Lỗi load tiện nghi:', err);
                    return { ...roomType, amenities: [] };
                }
            })
        );
        
        renderRoomTypes(roomTypesWithAmenities);
    } catch (error) {
        console.error('Lỗi load loại phòng:', error);
        const roomTypesListEl = document.getElementById('room-types-list');
        roomTypesListEl.innerHTML = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; text-align: center;">
                <p style="color: #721c24; margin-bottom: 10px;"><strong>❌ Lỗi tải các loại phòng</strong></p>
                <p style="color: #721c24; font-size: 14px;">${error.message}</p>
                <p style="color: #999; font-size: 12px; margin-top: 10px;">Vui lòng kiểm tra console để xem chi tiết lỗi.</p>
            </div>
        `;
    }
}

function renderRoomTypes(roomTypes) {
    const roomTypesList = document.getElementById('room-types-list');
    
    roomTypesList.innerHTML = roomTypes.map(roomType => {
        const price = parseFloat(roomType.Price || 0).toLocaleString('vi-VN');
        const area = roomType.Area ? `${roomType.Area} m²` : '';
        const bedInfo = roomType.BedType || '';
        const maxGuests = roomType.MaxGuests || 2;
        // Ưu tiên dùng ActualAvailableRooms nếu có (khi có checkIn/checkOut), nếu không dùng AvailableRooms
        const availableRooms = roomType.ActualAvailableRooms !== undefined && roomType.ActualAvailableRooms !== null 
            ? roomType.ActualAvailableRooms 
            : (roomType.AvailableRooms !== undefined && roomType.AvailableRooms !== null ? roomType.AvailableRooms : 10);
        
        // Nhóm tiện nghi theo category
        const amenitiesByCategory = {};
        if (roomType.amenities && roomType.amenities.length > 0) {
            roomType.amenities.forEach(amenity => {
                const category = amenity.Category || 'Other';
                if (!amenitiesByCategory[category]) {
                    amenitiesByCategory[category] = [];
                }
                amenitiesByCategory[category].push(amenity);
            });
        }
        
        const imageUrl = roomType.ImageURL || 'https://via.placeholder.com/800x400?text=No+Image';
        
        return `
            <div class="room-type-card">
                ${imageUrl ? `
                    <div class="room-type-image">
                        <img src="${imageUrl}" alt="${roomType.RoomTypeName}" onerror="this.src='https://via.placeholder.com/800x400?text=No+Image'">
                    </div>
                ` : ''}
                <div class="room-type-header">
                    <div class="room-type-info">
                        <h4>${roomType.RoomTypeName}</h4>
                        <div class="room-type-meta">
                            ${area ? `<span><i class="fa fa-arrows-alt"></i> ${area}</span>` : ''}
                            ${bedInfo ? `<span><i class="fa fa-bed"></i> ${bedInfo}</span>` : ''}
                            <span><i class="fa fa-users"></i> Tối đa ${maxGuests} khách</span>
                            ${roomType.AmenityCount ? `<span><i class="fa fa-check-circle"></i> ${roomType.AmenityCount} tiện nghi</span>` : ''}
                            <span style="color: ${availableRooms > 0 ? '#28a745' : '#dc3545'}; font-weight: bold;">
                                <i class="fa fa-door-open"></i> Còn ${availableRooms} phòng
                            </span>
                        </div>
                    </div>
                    <div class="room-type-price">
                        <div class="price">${price} VNĐ</div>
                        <div class="price-label">/đêm</div>
                    </div>
                </div>
                
                ${roomType.Description ? `<div class="room-type-description">${roomType.Description}</div>` : ''}
                
                ${Object.keys(amenitiesByCategory).length > 0 ? `
                    <div class="amenities-section">
                        ${Object.entries(amenitiesByCategory).map(([category, amenities]) => `
                            <div class="amenities-group">
                                <div class="amenities-title">${category}</div>
                                <div class="amenities-grid">
                                    ${amenities.map(amenity => `
                                        <div class="amenity-item">
                                            <i class="fa ${amenity.IconClass || 'fa-check'}"></i>
                                            <span>${amenity.AmenityName}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="room-type-actions">
                    <div class="room-type-quantity">
                        <label>Số lượng:</label>
                        <select id="quantity-${roomType.RoomTypeID}">
                            ${Array.from({length: Math.min(availableRooms, 5)}, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn-book-room-type" onclick="bookRoomType(${roomType.RoomTypeID}, '${roomType.RoomTypeName.replace(/'/g, "\\'")}')" ${availableRooms === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        ${availableRooms === 0 ? 'Hết phòng' : 'Đặt ngay'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function bookRoomType(roomTypeId, roomTypeName) {
    const checkIn = document.getElementById('checkin-detail').value;
    const checkOut = document.getElementById('checkout-detail').value;
    const quantity = document.getElementById(`quantity-${roomTypeId}`).value;
    
    if (!checkIn || !checkOut) {
        alert('Vui lòng chọn ngày nhận và trả phòng!');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        if (confirm('Bạn cần đăng nhập để đặt phòng. Chuyển đến trang đăng nhập?')) {
            window.location.href = '../auth/login.html';
        }
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const adults = urlParams.get('adults') || 2;
    const children = urlParams.get('children') || 0;
    const rooms = parseInt(quantity);
    
    // Chuyển hướng đến trang booking step 1
    const bookingParams = new URLSearchParams({
        roomId: roomId,
        checkIn: checkIn,
        checkOut: checkOut,
        adults: adults,
        children: children,
        rooms: rooms,
        roomTypeId: roomTypeId,
        roomTypeName: roomTypeName
    });
    
    window.location.href = `booking-step1.html?${bookingParams.toString()}`;
}

// ================= BOOKING =================
// Hàm này giữ lại để tương thích với code cũ, nhưng sẽ chuyển hướng đến booking-step1
function bookRoom(roomId, checkIn, checkOut) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        if (confirm('Bạn cần đăng nhập để đặt phòng. Chuyển đến trang đăng nhập?')) {
            window.location.href = '../auth/login.html';
        }
        return;
    }
    
    // Lấy thông tin guests từ URL hoặc mặc định
    const urlParams = new URLSearchParams(window.location.search);
    const adults = parseInt(urlParams.get('adults')) || 2;
    const children = parseInt(urlParams.get('children')) || 0;
    const rooms = parseInt(urlParams.get('rooms')) || 1;
    
    // Chuyển hướng đến trang booking step 1
    const bookingParams = new URLSearchParams({
        roomId: roomId,
        checkIn: checkIn,
        checkOut: checkOut,
        adults: adults,
        children: children,
        rooms: rooms
    });
    
    window.location.href = `booking-step1.html?${bookingParams.toString()}`;
}

function scrollToBooking() {
    const section = document.querySelector('.room-types-section') || document.querySelector('.available-rooms-section');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

