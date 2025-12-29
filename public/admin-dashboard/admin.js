/* ================= CẤU HÌNH CHUNG ================= */
const API_URL = "http://localhost:3000/api/admin";
const token = localStorage.getItem('token');

// Kiểm tra quyền Admin
if (!token || localStorage.getItem('role') != 1) {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "/public/auth/login.html";
}

// Hàm fetch có xác thực
async function fetchWithAuth(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token
    };
    return fetch(`${API_URL}${endpoint}`, { ...options, headers });
}

const ALL_CITIES = [
    "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Huế", 
    "Nha Trang", "Đà Lạt", "Phú Quốc", "Vũng Tàu", "Quy Nhơn", "Hội An", 
    "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", 
    "Bắc Ninh", "Bến Tre", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", 
    "Cao Bằng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", 
    "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", 
    "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", 
    "Lâm Đồng", "Lạng Sơn", "Long An", "Nam Định", "Nghệ An", "Ninh Thuận", 
    "Phú Thọ", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", 
    "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", 
    "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", 
    "Vĩnh Phúc", "Yên Bái"
];

function initCitySuggestions() {
    const dataList = document.getElementById('city-list');
    if (!dataList) return; // Tránh lỗi nếu không tìm thấy

    dataList.innerHTML = ''; // Xóa cũ nếu có

    ALL_CITIES.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        dataList.appendChild(option);
    });
}


/* ================= QUẢN LÝ TAB & UI ================= */
document.addEventListener("DOMContentLoaded", () => {
    loadAccounts(); // Mặc định load tab đầu tiên
    initCitySuggestions(); // Khởi tạo gợi ý thành phố

    const toggleBtn = document.getElementById("menu-toggle");
    
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            // Toggle class 'hide-menu' cho thẻ body
            document.body.classList.toggle("hide-menu");
        });
    }

    // Xử lý chuyển tab
    document.querySelectorAll(".menu-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            // Đổi active menu
            document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            // Đổi section hiển thị
            document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active-section"));
            const targetId = item.getAttribute("data-target");
            document.getElementById(targetId).classList.add("active-section");
            
            // Đổi tiêu đề và load dữ liệu
            document.getElementById("section-title").innerText = item.querySelector("a").innerText.trim();
            if (targetId === 'section-accounts') loadAccounts();
            if (targetId === 'section-hotels') loadHotels();
            if (targetId === 'section-staff') loadStaff();
            if (targetId === 'section-rooms') loadRoomTypes();
            if (targetId === 'section-categories') loadCategories();
            if (targetId === 'section-bookings') loadBookings();
        });
    });

    // Đăng xuất
    document.getElementById("logout-btn").onclick = () => {
        localStorage.clear();
        window.location.href = "../auth/login.html";
    };
});

/* ================= 1. MODULE TÀI KHOẢN ================= */
async function loadAccounts() {
    try {
        const res = await fetchWithAuth("/users");
        const users = await res.json();
        const tbody = document.getElementById("account-table-body");
        tbody.innerHTML = "";

        users.forEach((user, index) => {
            // Hiển thị ID theo thứ tự (1, 2, 3, 4...)
            const displayId = index + 1;
            
            // Xác định tên role
            let roleName = 'Khách';
            if (user.RoleID === 1) roleName = 'Admin';
            else if (user.RoleID === 3) roleName = 'Nhân viên';
            
            const date = new Date(user.CreatedAt).toLocaleDateString('vi-VN');
            const isLocked = user.IsLocked === 1;
            const isAdmin = user.RoleID === 1;
            const isStaff = user.RoleID === 3;
            
            // Badge trạng thái
            let statusBadge = '';
            if (isLocked) {
                statusBadge = '<span class="badge badge-danger" style="background:#dc3545; color:white; padding:3px 8px; border-radius:3px; font-size:11px;"><i class="fas fa-lock"></i> Đã khóa</span>';
            } else {
                statusBadge = '<span class="badge badge-success" style="background:#28a745; color:white; padding:3px 8px; border-radius:3px; font-size:11px;"><i class="fas fa-check-circle"></i> Hoạt động</span>';
            }
            
            // Nút xóa/khóa - Ẩn cho admin, hiển thị cho khách hàng và nhân viên
            let deleteButton = '';
            if (!isAdmin) {
                const buttonText = isLocked ? 'Mở khóa' : 'Khóa';
                const buttonClass = isLocked ? 'btn-success' : 'btn-danger';
                const buttonIcon = isLocked ? 'fa-unlock' : 'fa-lock';
                deleteButton = `<button onclick="deleteAccount(${user.AccountID}, ${isLocked})" class="btn btn-sm ${buttonClass}"><i class="fas ${buttonIcon}"></i> ${buttonText}</button>`;
            }
            
            tbody.innerHTML += `
                <tr>
                    <td>${displayId}</td>
                    <td>${user.Username}</td>
                    <td>${user.Email}</td>
                    <td>${roleName}</td>
                    <td>${statusBadge}</td>
                    <td>${date}</td>
                    <td>
                        <button onclick="openEditAccount(${user.AccountID}, '${user.Username}', '${user.Email}', ${user.RoleID})" class="btn btn-sm btn-warning"><i class="fas fa-edit"></i></button>
                        ${deleteButton}
                    </td>
                </tr>`;
        });
    } catch (err) { console.error(err); }
}

// Mở Modal Thêm User
document.getElementById("btn-add-account").onclick = () => {
    document.getElementById("account-form").reset();
    document.getElementById("acc-id").value = ""; // Xóa ID => Chế độ Thêm
    document.getElementById("acc-username").readOnly = false;
    document.querySelector("#modal-account h3").innerText = "Thêm Tài khoản mới";
    document.getElementById("modal-account").style.display = "flex";
};

// Mở Modal Sửa User
function openEditAccount(id, user, email, role) {
    document.getElementById("acc-id").value = id; // Có ID => Chế độ Sửa
    document.getElementById("acc-username").value = user;
    document.getElementById("acc-username").readOnly = true; // Cấm sửa username
    document.getElementById("acc-email").value = email;
    document.getElementById("acc-role").value = role;
    document.getElementById("acc-password").value = ""; 

    document.querySelector("#modal-account h3").innerText = "Cập nhật Tài khoản";
    document.getElementById("modal-account").style.display = "flex";
}

// Xử lý Submit Form User (Thêm hoặc Sửa)
document.getElementById("account-form").onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById("acc-id").value;
    const method = id ? "PUT" : "POST";
    const url = id ? `/users/${id}` : "/users";
    
    const data = {
        username: document.getElementById("acc-username").value,
        email: document.getElementById("acc-email").value,
        role: document.getElementById("acc-role").value,
        password: document.getElementById("acc-password").value
    };

    const res = await fetchWithAuth(url, { method: method, body: JSON.stringify(data) });
    if (res.ok) {
        alert("Thành công!");
        document.getElementById("modal-account").style.display = "none";
        loadAccounts();
    } else {
        alert("Có lỗi xảy ra!");
    }
};

async function deleteAccount(id, isLocked = false) {
    const action = isLocked ? "mở khóa" : "khóa";
    const confirmMsg = isLocked 
        ? `Mở khóa tài khoản này? Tài khoản sẽ có thể đăng nhập lại.`
        : `Khóa tài khoản này? Tài khoản sẽ không thể đăng nhập.`;
    
    if(confirm(confirmMsg)) {
        try {
            const actionParam = isLocked ? '?action=unlock' : '?action=lock';
            const res = await fetchWithAuth(`/users/${id}${actionParam}`, { method: "DELETE" });
            if(res.ok) { 
                const result = await res.json();
                alert(result.message || `Đã ${action} tài khoản!`); 
                loadAccounts(); 
            } else {
                const errorData = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
                alert("Lỗi: " + (errorData.error || "Không thể thực hiện thao tác!"));
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối server!");
        }
    }
}

/* ================= 2. MODULE DANH MỤC ================= */
async function loadCategories() {
    try {
        const res = await fetchWithAuth("/categories");
        const cats = await res.json();
        const tbody = document.getElementById("category-table-body");
        tbody.innerHTML = "";
        cats.forEach((cat, index) => {
            const displayId = index + 1; // ID hiển thị theo thứ tự
            // Chú ý: Dùng dấu nháy đơn trong chuỗi tham số để tránh lỗi
            const desc = cat.Description ? cat.Description.replace(/'/g, "\\'") : ""; 
            tbody.innerHTML += `
                <tr>
                    <td>${displayId}</td>
                    <td>${cat.CategoryName}</td>
                    <td>${cat.Description || ''}</td>
                    <td>
                        <button onclick="openEditCategory(${cat.CategoryID}, '${cat.CategoryName}', '${desc}')" class="btn btn-sm btn-warning"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteCategory(${cat.CategoryID})" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    } catch (err) { console.error(err); }
}

document.getElementById("btn-add-category").onclick = () => {
    document.getElementById("category-form").reset();
    document.getElementById("cat-id").value = "";
    document.querySelector("#modal-category h3").innerText = "Thêm Danh mục mới";
    document.getElementById("modal-category").style.display = "flex";
};

function openEditCategory(id, name, desc) {
    document.getElementById("cat-id").value = id;
    document.getElementById("cat-name").value = name;
    document.getElementById("cat-desc").value = desc;
    document.querySelector("#modal-category h3").innerText = "Cập nhật Danh mục";
    document.getElementById("modal-category").style.display = "flex";
}

document.getElementById("category-form").onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById("cat-id").value;
    const method = id ? "PUT" : "POST";
    const url = id ? `/categories/${id}` : "/categories";

    const data = {
        name: document.getElementById("cat-name").value,
        description: document.getElementById("cat-desc").value
    };

    const res = await fetchWithAuth(url, { method, body: JSON.stringify(data) });
    if(res.ok) {
        alert("Thành công!");
        document.getElementById("modal-category").style.display = "none";
        loadCategories();
    } else alert("Lỗi!");
};

async function deleteCategory(id) {
    if(confirm("Xóa danh mục này?")) {
        const res = await fetchWithAuth(`/categories/${id}`, { method: "DELETE" });
        if(res.ok) { alert("Đã xóa!"); loadCategories(); }
        else alert("Không thể xóa danh mục đang có phòng!");
    }
}

/* ================= 3. MODULE KHÁCH SẠN ================= */
let allHotels = []; // Lưu danh sách hotels để filter

async function loadHotels() {
    try {
        const res = await fetchWithAuth("/rooms");
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
            throw new Error(errorData.error || "Lỗi tải dữ liệu");
        }
        
        allHotels = await res.json();
        loadCategoriesForHotelSelect();
        renderHotels(allHotels);
    } catch (err) { 
        console.error(err);
        const tbody = document.getElementById("hotel-table-body");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999;">Lỗi tải dữ liệu: ${err.message || 'Không xác định'}</td></tr>`;
        }
    }
}

function renderHotels(hotels) {
    const tbody = document.getElementById("hotel-table-body");
        tbody.innerHTML = "";
        
    if (hotels.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999;">Không tìm thấy khách sạn nào</td></tr>`;
        return;
    }

    hotels.forEach((hotel, index) => {
        const displayId = index + 1; // ID hiển thị theo thứ tự
        const statusText = hotel.Status === 'available' ? 'Hoạt động' : 'Bảo trì';
        const img = hotel.ImageURL ? `<img src="${hotel.ImageURL}" class="table-img">` : '';
            
            // Xử lý chuỗi để tránh lỗi JS
        const desc = hotel.Description ? hotel.Description.replace(/\n/g, "\\n").replace(/'/g, "\\'") : "";
        const addr = hotel.Address ? hotel.Address.replace(/'/g, "\\'") : "";
        const lat = hotel.Latitude || '';
        const lng = hotel.Longitude || '';

            tbody.innerHTML += `
                <tr>
                <td>${displayId}</td>
                    <td>${img}</td>
                <td><b>${hotel.RoomName}</b></td>
                <td><small style="color:#666"><i class="fas fa-map-marker-alt"></i> ${hotel.Address || '---'}</small></td>
                <td>${hotel.CategoryName || '---'}</td>
                    <td>${statusText}</td>
                    <td>
                    <button onclick="openEditHotel(${hotel.RoomID}, '${hotel.RoomName}', ${hotel.CategoryID || 'null'}, '${hotel.Status}', '${desc}', '${hotel.ImageURL || ''}', '${addr}', '${lat}', '${lng}')" class="btn btn-sm btn-warning"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteHotel(${hotel.RoomID})" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        });
}

function filterHotels() {
    const searchInput = document.getElementById('hotel-search');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderHotels(allHotels);
        return;
    }
    
    const filteredHotels = allHotels.filter(hotel => {
        const name = (hotel.RoomName || '').toLowerCase();
        const address = (hotel.Address || '').toLowerCase();
        const category = (hotel.CategoryName || '').toLowerCase();
        
        return name.includes(searchTerm) || 
               address.includes(searchTerm) || 
               category.includes(searchTerm);
    });
    
    renderHotels(filteredHotels);
}

async function loadCategoriesForHotelSelect() {
    const res = await fetchWithAuth("/categories");
    const cats = await res.json();
    const select = document.getElementById("hotel-category");
    if (select) {
    select.innerHTML = "";
    cats.forEach(c => select.innerHTML += `<option value="${c.CategoryID}">${c.CategoryName}</option>`);
    }
}

document.getElementById("btn-add-hotel").onclick = () => {
    document.getElementById("hotel-form").reset();
    document.getElementById("hotel-id").value = "";
    document.querySelector("#modal-hotel h3").innerText = "Thêm Khách sạn mới";
    document.getElementById("modal-hotel").style.display = "flex";
    loadCategoriesForHotelSelect();
};

function openEditHotel(id, name, catId, status, desc, img, address, lat, lng) {
    document.getElementById("hotel-id").value = id;
    document.getElementById("hotel-name").value = name;
    if (catId && catId !== 'null') document.getElementById("hotel-category").value = catId;
    document.getElementById("hotel-status").value = status;
    document.getElementById("hotel-description").value = desc;
    document.getElementById("hotel-image").value = img || '';
    document.getElementById("hotel-address").value = address || '';
    document.getElementById("hotel-lat").value = lat || '';
    document.getElementById("hotel-lng").value = lng || '';

    document.querySelector("#modal-hotel h3").innerText = "Cập nhật Khách sạn";
    document.getElementById("modal-hotel").style.display = "flex";
    loadCategoriesForHotelSelect();
}

document.getElementById("hotel-form").onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById("hotel-id").value;
    const method = id ? "PUT" : "POST";
    const url = id ? `/rooms/${id}` : "/rooms";

    const data = {
        name: document.getElementById("hotel-name").value,
        address: document.getElementById("hotel-address").value, 
        category_id: document.getElementById("hotel-category").value,
        price: 0, // Khách sạn không có giá, giá nằm ở RoomTypes
        status: document.getElementById("hotel-status").value,
        description: document.getElementById("hotel-description").value,
        image: document.getElementById("hotel-image").value,
        lat: document.getElementById("hotel-lat").value || null,
        lng: document.getElementById("hotel-lng").value || null
    };

    const res = await fetchWithAuth(url, { method, body: JSON.stringify(data) });
    if(res.ok) {
        alert("Thành công!");
        document.getElementById("modal-hotel").style.display = "none";
        loadHotels();
    } else {
        const errorData = await res.json();
        alert("Lỗi: " + (errorData.error || "Không xác định"));
    }
};

async function deleteHotel(id) {
    if(confirm("Xóa khách sạn này? Tất cả loại phòng trong khách sạn cũng sẽ bị xóa!")) {
        const res = await fetchWithAuth(`/rooms/${id}`, { method: "DELETE" });
        if(res.ok) { alert("Đã xóa!"); loadHotels(); }
        else alert("Lỗi xóa khách sạn!");
    }
}

/* ================= 4. MODULE LOẠI PHÒNG (ROOM TYPES) ================= */
async function loadRoomTypes() {
    try {
        // Load danh sách khách sạn cho filter
        await loadHotelsForFilter();
        
        const hotelFilter = document.getElementById("hotel-filter").value;
        
        // Load tất cả room types từ admin API (thêm timestamp để tránh cache)
        // Lưu ý: API_URL đã có /admin nên chỉ cần /roomtypes
        const res = await fetchWithAuth(`/roomtypes?t=${new Date().getTime()}`);
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
            throw new Error(errorData.error || "Lỗi tải dữ liệu");
        }
        
        let roomTypes = await res.json();
        
        // Filter theo hotel nếu có
        if (hotelFilter) {
            roomTypes = roomTypes.filter(rt => rt.HotelID == hotelFilter);
        }
        
        renderRoomTypes(roomTypes);
    } catch (err) { 
        console.error(err);
        const tbody = document.getElementById("roomtype-table-body");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#999;">Lỗi tải dữ liệu: ${err.message || 'Có thể bảng RoomTypes chưa được tạo.'}</td></tr>`;
        }
    }
}

function renderRoomTypes(roomTypes) {
    const tbody = document.getElementById("roomtype-table-body");
    tbody.innerHTML = "";
    
    if (!roomTypes || roomTypes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#999;">Chưa có loại phòng nào.</td></tr>';
        return;
    }
    
    loadHotelsForRoomTypeSelect();

    roomTypes.forEach((rt, index) => {
        const displayId = index + 1; // ID hiển thị theo thứ tự
        const price = new Intl.NumberFormat('vi-VN').format(rt.Price || 0);
        const img = rt.ImageURL ? `<img src="${rt.ImageURL}" class="table-img">` : '';
        const area = rt.Area ? `${rt.Area} m²` : '---';
        const maxGuests = rt.MaxGuests || 2;
        
        // Xử lý chuỗi để tránh lỗi JS
        const desc = rt.Description ? rt.Description.replace(/\n/g, "\\n").replace(/'/g, "\\'") : "";
        const name = rt.RoomTypeName ? rt.RoomTypeName.replace(/'/g, "\\'") : "";
        const hotelName = rt.HotelName ? rt.HotelName.replace(/'/g, "\\'") : "";
        const bedType = rt.BedType ? rt.BedType.replace(/'/g, "\\'") : "";

        // Xử lý area để truyền vào hàm edit
        const areaValue = rt.Area ? rt.Area : '';
        const availableRooms = rt.AvailableRooms !== undefined && rt.AvailableRooms !== null ? rt.AvailableRooms : 10;
        
        tbody.innerHTML += `
            <tr>
                <td>${displayId}</td>
                <td>${img}</td>
                <td><b>${rt.RoomTypeName}</b></td>
                <td><small>${rt.HotelName || '---'}</small></td>
                <td>${price} đ</td>
                <td>${area}</td>
                <td>${maxGuests} khách</td>
                <td><b style="color: ${availableRooms > 0 ? '#28a745' : '#dc3545'}">${availableRooms}</b> phòng</td>
                <td>
                    <button onclick="openEditRoomType(${rt.RoomTypeID}, ${rt.HotelID}, '${name}', ${rt.Price || 0}, '${areaValue}', ${maxGuests}, '${bedType}', ${rt.BedCount || 1}, '${rt.ImageURL || ''}', '${desc}', ${availableRooms})" class="btn btn-sm btn-warning"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteRoomType(${rt.RoomTypeID})" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

async function loadHotelsForFilter() {
    try {
        const res = await fetchWithAuth("/rooms");
        const hotels = await res.json();
        const select = document.getElementById("hotel-filter");
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">-- Tất cả khách sạn --</option>';
            hotels.forEach(h => {
                select.innerHTML += `<option value="${h.RoomID}">${h.RoomName}</option>`;
            });
            if (currentValue) select.value = currentValue;
            
            // Thêm event listener để filter
            select.onchange = () => loadRoomTypes();
        }
    } catch (err) { console.error(err); }
}

async function loadHotelsForRoomTypeSelect() {
    try {
        const res = await fetchWithAuth("/rooms");
        const hotels = await res.json();
        const select = document.getElementById("roomtype-hotel");
        if (select) {
            select.innerHTML = "";
            hotels.forEach(h => {
                select.innerHTML += `<option value="${h.RoomID}">${h.RoomName}</option>`;
            });
        }
    } catch (err) { console.error(err); }
}

document.getElementById("btn-add-roomtype").onclick = () => {
    document.getElementById("roomtype-form").reset();
    document.getElementById("roomtype-id").value = "";
    document.querySelector("#modal-roomtype h3").innerText = "Thêm Loại phòng mới";
    document.getElementById("modal-roomtype").style.display = "flex";
    loadHotelsForRoomTypeSelect();
};

function openEditRoomType(id, hotelId, name, price, area, maxGuests, bedType, bedCount, img, desc, availableRooms) {
    document.getElementById("roomtype-id").value = id;
    document.getElementById("roomtype-hotel").value = hotelId || '';
    document.getElementById("roomtype-name").value = name || '';
    document.getElementById("roomtype-price").value = price || 0;
    document.getElementById("roomtype-area").value = area || '';
    document.getElementById("roomtype-maxguests").value = maxGuests || 2;
    document.getElementById("roomtype-bedtype").value = bedType || '';
    document.getElementById("roomtype-bedcount").value = bedCount || 1;
    document.getElementById("roomtype-image").value = img || '';
    document.getElementById("roomtype-description").value = desc || '';
    document.getElementById("roomtype-availablerooms").value = availableRooms !== undefined ? availableRooms : 10;

    document.querySelector("#modal-roomtype h3").innerText = "Cập nhật Loại phòng";
    document.getElementById("modal-roomtype").style.display = "flex";
    loadHotelsForRoomTypeSelect();
}

document.getElementById("roomtype-form").onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById("roomtype-id").value;
    
    // Tạo hoặc cập nhật RoomType
    const areaInput = document.getElementById("roomtype-area").value;
    const areaValue = areaInput && areaInput.trim() !== '' ? parseFloat(areaInput) : null;
    
    const data = {
        hotelId: document.getElementById("roomtype-hotel").value,
        roomTypeName: document.getElementById("roomtype-name").value,
        price: parseFloat(document.getElementById("roomtype-price").value),
        area: areaValue,
        maxGuests: parseInt(document.getElementById("roomtype-maxguests").value) || 2,
        bedType: document.getElementById("roomtype-bedtype").value || null,
        bedCount: parseInt(document.getElementById("roomtype-bedcount").value) || 1,
        imageURL: document.getElementById("roomtype-image").value || null,
        description: document.getElementById("roomtype-description").value || null,
        availableRooms: parseInt(document.getElementById("roomtype-availablerooms").value) || 10
    };
    
    // Validate
    if (!data.hotelId || !data.roomTypeName || !data.price || data.price <= 0) {
        alert("Vui lòng điền đầy đủ: Khách sạn, Tên loại phòng, và Giá (phải > 0)!");
        return;
    }

    try {
        let res;
        if (id) {
            // Update
            res = await fetchWithAuth(`/roomtypes/${id}`, { 
                method: "PUT", 
                body: JSON.stringify(data) 
            });
        } else {
            // Create
            res = await fetchWithAuth("/roomtypes", { 
                method: "POST", 
                body: JSON.stringify(data) 
            });
        }
        
        if(res.ok) {
            alert("Thành công!");
            document.getElementById("modal-roomtype").style.display = "none";
            // Đợi một chút để đảm bảo database đã cập nhật
            setTimeout(() => {
                loadRoomTypes();
            }, 100);
        } else {
            const errorData = await res.json();
            alert("Lỗi: " + (errorData.error || "Không xác định"));
        }
    } catch (err) {
        console.error(err);
        alert("Lỗi kết nối server!");
    }
};

async function deleteRoomType(id) {
    if(confirm("Xóa loại phòng này?")) {
        try {
            const res = await fetchWithAuth(`/roomtypes/${id}`, { method: "DELETE" });
            if(res.ok) { 
                alert("Đã xóa!"); 
                loadRoomTypes(); 
            } else {
                const errorData = await res.json();
                alert("Lỗi: " + (errorData.error || "Không xác định"));
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối server!");
        }
    }
}

/* ================= 4. MODULE BOOKING (ĐƠN HÀNG) ================= */

let allBookings = []; // Lưu danh sách bookings để filter

// Hàm load danh sách Booking
async function loadBookings() {
    try {
        const res = await fetchWithAuth("/bookings");
        allBookings = await res.json();
        renderBookings(allBookings);
    } catch (err) {
        console.error(err);
        const tbody = document.getElementById("booking-table-body");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#999;">Lỗi tải dữ liệu: ${err.message || 'Không xác định'}</td></tr>`;
        }
    }
}

function renderBookings(bookings) {
        const tbody = document.getElementById("booking-table-body");
        tbody.innerHTML = "";

    if (bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#999;">Không tìm thấy hóa đơn nào</td></tr>`;
        return;
    }

        bookings.forEach(bk => {
            // Tính số đêm để tính tổng tiền
            const inDate = new Date(bk.CheckInDate);
            const outDate = new Date(bk.CheckOutDate);
            const nights = Math.max(1, Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24))); 
            
            // Tính tổng tiền: (Giá mỗi đêm * Số đêm * Số phòng) + Thuế 8%
            // Ưu tiên sử dụng giá từ RoomType nếu có, nếu không thì dùng giá từ Room
            const rooms = bk.Rooms || 1;
            const pricePerNight = bk.RoomTypePrice ? parseFloat(bk.RoomTypePrice) : (parseFloat(bk.Price) || 0);
            const basePrice = pricePerNight * nights * rooms;
            const tax = basePrice * 0.08;
            const total = basePrice + tax;

            // Format ngày tháng hiển thị
            const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN');
            const fmtMoney = (m) => new Intl.NumberFormat('vi-VN').format(Math.round(m)) + ' VNĐ';

            // Thông tin khách
            const adults = bk.Adults || 2;
            const children = bk.Children || 0;
            let guestsInfo = `${adults} người lớn`;
            if (children > 0) guestsInfo += `, ${children} trẻ em`;
            guestsInfo += `<br><small style="color:#666">${rooms} phòng</small>`;
            
            // Thông tin khách hàng (ưu tiên GuestName nếu có, không thì dùng Username)
            const guestName = bk.GuestName || bk.Username;
            const guestEmail = bk.GuestEmail || bk.Email;
            const guestPhone = bk.GuestPhone || '';
            const specialRequests = bk.SpecialRequests || '';
            const arrivalTime = bk.ArrivalTime || '';

            // 1. Xử lý Màu sắc Trạng thái (Badge)
            let badgeClass = 'badge-secondary'; // Mặc định màu xám
            let statusLabel = bk.Status;

            if (bk.Status === 'Pending') { badgeClass = 'badge-warning'; statusLabel = 'Chờ duyệt'; }
            if (bk.Status === 'Confirmed') { badgeClass = 'badge-primary'; statusLabel = 'Đã duyệt'; }
            if (bk.Status === 'CheckedIn') { badgeClass = 'badge-info'; statusLabel = 'Đang ở'; }
            if (bk.Status === 'CheckedOut') { badgeClass = 'badge-success'; statusLabel = 'Hoàn tất'; }
            if (bk.Status === 'Cancelled') { badgeClass = 'badge-danger'; statusLabel = 'Đã hủy'; }

            // Tooltip với thông tin chi tiết
            let tooltipInfo = '';
            if (guestPhone) tooltipInfo += `SĐT: ${guestPhone}<br>`;
            if (arrivalTime) tooltipInfo += `Thời gian đến: ${arrivalTime}<br>`;
            if (specialRequests) tooltipInfo += `Yêu cầu: ${specialRequests}`;

            // 2. Render HTML
            tbody.innerHTML += `
                <tr>
                    <td>
                        #${bk.BookingID}
                        <br>
                        <button onclick="viewBookingDetail(${bk.BookingID})" class="btn btn-sm" style="padding:2px 8px; font-size:11px; margin-top:5px;" title="Xem chi tiết">
                            <i class="fas fa-eye"></i> Chi tiết
                        </button>
                    </td>
                    <td>
                        <b>${guestName}</b><br>
                        <small>${guestEmail}</small>
                        ${guestPhone ? `<br><small style="color:#666;"><i class="fas fa-phone"></i> ${guestPhone}</small>` : ''}
                    </td>
                    <td>${bk.RoomName}</td>
                    <td>${fmtDate(bk.CheckInDate)}</td>
                    <td>${fmtDate(bk.CheckOutDate)}</td>
                    <td><strong>${nights} đêm</strong></td>
                    <td>${guestsInfo}</td>
                    <td style="color:#d4111e; font-weight:bold">${fmtMoney(total)}</td>
                    <td>
                        <span class="badge ${badgeClass}" style="padding: 5px 10px; font-size: 12px;">${statusLabel}</span>
                        ${bk.DepositAmount && bk.DepositAmount > 0 ? `
                            <br>
                            <small style="color:#856404; display:inline-block; margin-top:3px;">
                                <i class="fas fa-money-bill-wave"></i> Đặt cọc: ${fmtMoney(bk.DepositAmount)}
                            </small>
                            <br>
                            ${bk.DepositStatus === 'confirmed' ? 
                                '<small style="color:#28a745; display:inline-block; margin-top:3px;"><i class="fas fa-check-circle"></i> Đã xác nhận đặt cọc</small>' : 
                                '<small style="color:#ffc107; display:inline-block; margin-top:3px;"><i class="fas fa-clock"></i> Chưa xác nhận đặt cọc</small>'
                            }
                        ` : ''}
                        ${bk.Status === 'CheckedIn' || bk.Status === 'CheckedOut' ? `
                            <br>
                            ${bk.CheckInConfirmed ? 
                                '<small style="color:#28a745; display:inline-block; margin-top:3px;"><i class="fas fa-check-circle"></i> Đã xác nhận Check-in</small>' : 
                                '<small style="color:#ffc107; display:inline-block; margin-top:3px;"><i class="fas fa-clock"></i> Chưa xác nhận Check-in</small>'
                            }
                        ` : ''}
                        ${bk.Status === 'CheckedOut' ? `
                            <br>
                            ${bk.CheckOutConfirmed ? 
                                '<small style="color:#28a745; display:inline-block; margin-top:3px;"><i class="fas fa-check-circle"></i> Đã xác nhận Check-out</small>' : 
                                '<small style="color:#ffc107; display:inline-block; margin-top:3px;"><i class="fas fa-clock"></i> Chưa xác nhận Check-out</small>'
                            }
                        ` : ''}
                    </td>
                    <td>
                        ${bk.Status === 'Pending' ? `
                            <button onclick="updateBookingStatus(${bk.BookingID}, 'Confirmed')" class="btn btn-sm btn-success" title="Duyệt đơn"><i class="fas fa-check"></i></button>
                            <button onclick="updateBookingStatus(${bk.BookingID}, 'Cancelled')" class="btn btn-sm btn-danger" title="Hủy đơn"><i class="fas fa-times"></i></button>
                        ` : ''}

                        ${bk.Status === 'Confirmed' ? `
                            <button onclick="updateBookingStatus(${bk.BookingID}, 'CheckedIn')" class="btn btn-sm btn-warning" style="color:#fff; margin-right:5px;" title="Khách nhận phòng (Check-in)"><i class="fas fa-key"></i></button>
                            <button onclick="updateBookingStatus(${bk.BookingID}, 'Pending')" class="btn btn-sm btn-secondary" style="background:#6c757d; color:white; border:none; margin-right:5px;" title="Quay lại trạng thái Chờ duyệt (nếu bấm nhầm)"><i class="fas fa-undo"></i> Quay lại</button>
                            <button onclick="updateBookingStatus(${bk.BookingID}, 'Cancelled')" class="btn btn-sm btn-danger" title="Hủy đơn"><i class="fas fa-times"></i></button>
                        ` : ''}

                        ${bk.Status === 'CheckedIn' ? `
                            <button onclick="updateBookingStatus(${bk.BookingID}, 'CheckedOut')" class="btn btn-sm btn-secondary" style="background:#343a40; color:white; border:none; margin-right:5px;" title="Khách trả phòng (Check-out)"><i class="fas fa-sign-out-alt"></i> Trả phòng</button>
                            <button onclick="updateBookingStatus(${bk.BookingID}, 'Confirmed')" class="btn btn-sm btn-info" style="background:#17a2b8; color:white; border:none;" title="Quay lại trạng thái Đã duyệt (nếu bấm nhầm)"><i class="fas fa-undo"></i> Quay lại</button>
                        ` : ''}

                        ${bk.Status === 'CheckedOut' ? `
                            <span style="color:green; font-weight:bold;"><i class="fas fa-check-circle"></i> Xong</span>
                        ` : ''}

                        ${bk.Status === 'Cancelled' ? `
                            <span style="color:#999">---</span>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
}

function filterBookings() {
    const searchInput = document.getElementById('booking-search');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderBookings(allBookings);
        return;
    }
    
    const filteredBookings = allBookings.filter(bk => {
        const bookingId = (bk.BookingID || '').toString();
        const guestName = ((bk.GuestName || bk.Username) || '').toLowerCase();
        const guestEmail = ((bk.GuestEmail || bk.Email) || '').toLowerCase();
        const roomName = (bk.RoomName || '').toLowerCase();
        const guestPhone = (bk.GuestPhone || '').toLowerCase();
        const status = (bk.Status || '').toLowerCase();
        
        return bookingId.includes(searchTerm) ||
               guestName.includes(searchTerm) ||
               guestEmail.includes(searchTerm) ||
               roomName.includes(searchTerm) ||
               guestPhone.includes(searchTerm) ||
               status.includes(searchTerm);
    });
    
    renderBookings(filteredBookings);
}

// Hàm cập nhật trạng thái (Duyệt/Hủy)
async function updateBookingStatus(id, status) {
    // Tạo thông báo xác nhận phù hợp
    let confirmMsg = '';
    const statusLabels = {
        'Pending': 'Chờ duyệt',
        'Confirmed': 'Đã duyệt',
        'CheckedIn': 'Đang ở',
        'CheckedOut': 'Hoàn tất',
        'Cancelled': 'Đã hủy'
    };
    
    const statusLabel = statusLabels[status] || status;
    
    // Kiểm tra xem có phải quay lại không (dựa vào logic: CheckedIn -> Confirmed, Confirmed -> Pending)
    if (status === 'Confirmed' || status === 'Pending') {
        confirmMsg = `Bạn muốn QUAY LẠI trạng thái đơn #${id} sang: "${statusLabel}"?\n\nLưu ý: Đây là thao tác quay lại trạng thái trước.`;
    } else {
        confirmMsg = `Bạn muốn chuyển trạng thái đơn #${id} sang: "${statusLabel}"?`;
    }
    
    if (!confirm(confirmMsg)) return;

    try {
        const res = await fetchWithAuth(`/bookings/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: status })
        });

        if (res.ok) {
            alert("Cập nhật thành công!");
            loadBookings(); // Tải lại bảng
        } else {
            const data = await res.json();
            alert("Lỗi cập nhật: " + (data.error || "Không xác định"));
        }
    } catch (err) { alert("Lỗi server!"); }
}

// Hàm xem chi tiết booking
async function viewBookingDetail(bookingId) {
    try {
        const res = await fetchWithAuth("/bookings");
        const bookings = await res.json();
        const booking = bookings.find(bk => bk.BookingID === bookingId);
        
        if (!booking) {
            alert("Không tìm thấy đơn đặt phòng!");
            return;
        }
        
        // Tính toán
        const inDate = new Date(booking.CheckInDate);
        const outDate = new Date(booking.CheckOutDate);
        const nights = Math.max(1, Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)));
        const rooms = booking.Rooms || 1;
        // Ưu tiên sử dụng giá từ RoomType nếu có, nếu không thì dùng giá từ Room
        const pricePerNight = booking.RoomTypePrice ? parseFloat(booking.RoomTypePrice) : (parseFloat(booking.Price) || 0);
        const basePrice = pricePerNight * nights * rooms;
        const tax = basePrice * 0.08;
        const total = basePrice + tax;
        
        const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const fmtMoney = (m) => new Intl.NumberFormat('vi-VN').format(Math.round(m)) + ' VNĐ';
        
        const adults = booking.Adults || 2;
        const children = booking.Children || 0;
        
        let statusLabel = booking.Status;
        if(booking.Status === 'Pending') statusLabel = 'Chờ duyệt';
        if(booking.Status === 'Confirmed') statusLabel = 'Đã duyệt';
        if(booking.Status === 'CheckedIn') statusLabel = 'Đang ở';
        if(booking.Status === 'CheckedOut') statusLabel = 'Hoàn tất';
        if(booking.Status === 'Cancelled') statusLabel = 'Đã hủy';
        
        const content = `
            <div style="text-align:left;">
                <div style="background:#f8f9fa; padding:15px; border-radius:6px; margin-bottom:20px;">
                    <h4 style="margin-top:0; color:#003580;">Thông tin đặt phòng</h4>
                    <p><strong>Mã đơn:</strong> #${booking.BookingID}</p>
                    <p><strong>Ngày đặt:</strong> ${new Date(booking.BookingDate).toLocaleDateString('vi-VN')}</p>
                    <p><strong>Trạng thái:</strong> <span class="badge badge-${booking.Status === 'Pending' ? 'warning' : booking.Status === 'Confirmed' ? 'primary' : booking.Status === 'CheckedIn' ? 'info' : booking.Status === 'CheckedOut' ? 'success' : 'danger'}" style="padding: 5px 10px;">${statusLabel}</span></p>
                </div>
                
                <div style="background:#f8f9fa; padding:15px; border-radius:6px; margin-bottom:20px;">
                    <h4 style="margin-top:0; color:#003580;">Thông tin khách hàng</h4>
                    <p><strong>Tên khách hàng:</strong> ${booking.GuestName || booking.Username}</p>
                    <p><strong>Email:</strong> ${booking.GuestEmail || booking.Email}</p>
                    ${booking.GuestPhone ? `<p><strong>Số điện thoại:</strong> ${booking.GuestPhone}</p>` : ''}
                    <p><strong>Tài khoản:</strong> ${booking.Username} (${booking.Email})</p>
                </div>
                
                <div style="background:#f8f9fa; padding:15px; border-radius:6px; margin-bottom:20px;">
                    <h4 style="margin-top:0; color:#003580;">Thông tin phòng</h4>
                    <p><strong>Tên phòng:</strong> ${booking.RoomName}</p>
                    ${booking.RoomTypeName ? `<p><strong>Loại phòng:</strong> ${booking.RoomTypeName}</p>` : ''}
                    <p><strong>Giá mỗi đêm:</strong> ${fmtMoney(pricePerNight)}</p>
                </div>
                
                ${booking.DepositAmount && booking.DepositAmount > 0 ? `
                <div style="background:#fff3cd; padding:15px; border-radius:6px; margin-bottom:20px; border-left:4px solid #ffc107;">
                    <h4 style="margin-top:0; color:#856404;"><i class="fas fa-money-bill-wave"></i> Thông tin Đặt cọc</h4>
                    <p><strong>Số tiền đặt cọc:</strong> <span style="color:#d9534f; font-weight:bold;">${fmtMoney(booking.DepositAmount)}</span></p>
                    <p><strong>Trạng thái:</strong> 
                        ${booking.DepositStatus === 'confirmed' ? 
                            '<span style="color:#28a745;"><i class="fas fa-check-circle"></i> Đã xác nhận</span>' : 
                            '<span style="color:#ffc107;"><i class="fas fa-clock"></i> Chưa xác nhận</span>'
                        }
                    </p>
                    ${booking.DepositInfo ? (() => {
                        try {
                            const depositInfo = typeof booking.DepositInfo === 'string' ? JSON.parse(booking.DepositInfo) : booking.DepositInfo;
                            return `
                                <p><strong>Thông tin chuyển khoản:</strong></p>
                                <ul style="margin-left:20px; color:#333;">
                                    <li>Số tài khoản: <strong>${depositInfo.accountNumber || 'N/A'}</strong></li>
                                    <li>Tên ngân hàng: <strong>${depositInfo.bankName || 'N/A'}</strong></li>
                                    <li>Chủ tài khoản: <strong>${depositInfo.accountName || 'N/A'}</strong></li>
                                    <li>Nội dung: <strong>${depositInfo.content || 'N/A'}</strong></li>
                                </ul>
                            `;
                        } catch (e) {
                            return '';
                        }
                    })() : ''}
                </div>
                ` : ''}
                
                ${booking.CheckInConfirmed || booking.CheckOutConfirmed || booking.RoomInspection ? `
                <div style="background:#e7f3ff; padding:15px; border-radius:6px; margin-bottom:20px; border-left:4px solid #007bff;">
                    <h4 style="margin-top:0; color:#003580;"><i class="fas fa-user-tie"></i> Trạng thái Xác nhận của Nhân viên</h4>
                    ${booking.CheckInConfirmed ? `<p><strong>Check-in:</strong> <span style="color:#28a745;"><i class="fas fa-check-circle"></i> Đã xác nhận</span></p>` : '<p><strong>Check-in:</strong> <span style="color:#999;"><i class="fas fa-clock"></i> Chưa xác nhận</span></p>'}
                    ${booking.CheckOutConfirmed ? `<p><strong>Check-out:</strong> <span style="color:#28a745;"><i class="fas fa-check-circle"></i> Đã xác nhận</span></p>` : '<p><strong>Check-out:</strong> <span style="color:#999;"><i class="fas fa-clock"></i> Chưa xác nhận</span></p>'}
                    ${booking.RoomInspection ? `<p><strong>Kiểm tra phòng:</strong><br><span style="background:white; padding:10px; border-radius:4px; display:inline-block; margin-top:5px; border:1px solid #ddd;">${booking.RoomInspection}</span></p>` : ''}
                </div>
                ` : ''}
                
                <div style="background:#f8f9fa; padding:15px; border-radius:6px; margin-bottom:20px;">
                    <h4 style="margin-top:0; color:#003580;">Chi tiết đặt phòng</h4>
                    <p><strong>Ngày nhận phòng:</strong> ${fmtDate(booking.CheckInDate)}</p>
                    <p><strong>Ngày trả phòng:</strong> ${fmtDate(booking.CheckOutDate)}</p>
                    <p><strong>Số đêm:</strong> ${nights} đêm</p>
                    <p><strong>Số người lớn:</strong> ${adults}</p>
                    <p><strong>Số trẻ em:</strong> ${children}</p>
                    <p><strong>Số phòng:</strong> ${rooms}</p>
                    ${booking.ArrivalTime ? `<p><strong>Thời gian đến:</strong> ${booking.ArrivalTime}</p>` : ''}
                </div>
                
                ${booking.SpecialRequests ? `
                <div style="background:#fff3cd; padding:15px; border-radius:6px; margin-bottom:20px; border-left:4px solid #ffc107;">
                    <h4 style="margin-top:0; color:#856404;">Yêu cầu đặc biệt</h4>
                    <p style="color:#856404;">${booking.SpecialRequests}</p>
                </div>
                ` : ''}
                
                ${booking.Status === 'Cancelled' && booking.CancelReason ? `
                <div style="background:#f8d7da; padding:15px; border-radius:6px; margin-bottom:20px; border-left:4px solid #dc3545;">
                    <h4 style="margin-top:0; color:#721c24;"><i class="fas fa-ban"></i> Lý do hủy đơn</h4>
                    <p style="color:#721c24;">${booking.CancelReason}</p>
                </div>
                ` : ''}
                
                <div style="background:#e3f2fd; padding:15px; border-radius:6px;">
                    <h4 style="margin-top:0; color:#003580;">Tóm tắt giá</h4>
                    <p><strong>Giá cơ bản:</strong> ${fmtMoney(basePrice)}</p>
                    <p><strong>Thuế (8%):</strong> ${fmtMoney(tax)}</p>
                    <p style="font-size:18px; font-weight:bold; color:#d4111e; margin-top:10px;"><strong>Tổng cộng:</strong> ${fmtMoney(total)}</p>
                </div>
            </div>
        `;
        
        document.getElementById('booking-detail-content').innerHTML = content;
        document.getElementById('modal-booking-detail').style.display = 'flex';
    } catch (err) {
        console.error(err);
        alert("Lỗi tải chi tiết đơn đặt phòng!");
    }
}

/* ================= QUẢN LÝ NHÂN VIÊN ================= */
let allStaff = [];
let allHotelsForAssign = [];

async function loadStaff() {
    try {
        const res = await fetchWithAuth('/users/staff');
        if (!res.ok) throw new Error('Lỗi tải danh sách nhân viên');
        allStaff = await res.json();
        renderStaff(allStaff);
    } catch (err) {
        console.error(err);
        document.getElementById('staff-table-body').innerHTML = 
            '<tr><td colspan="6" style="text-align:center;color:#dc3545;">Lỗi tải dữ liệu!</td></tr>';
    }
}

function renderStaff(staffList) {
    const tbody = document.getElementById('staff-table-body');
    if (!staffList || staffList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Chưa có nhân viên nào</td></tr>';
        return;
    }
    
    tbody.innerHTML = staffList.map((staff, index) => {
        const displayId = index + 1; // ID hiển thị theo thứ tự
        const hotels = staff.AssignedHotels ? staff.AssignedHotels.split('|').map(h => {
            const [id, name] = h.split(':');
            return name || 'N/A';
        }).join(', ') : 'Chưa phân công';
        
        return `
            <tr>
                <td>${displayId}</td>
                <td>${staff.Username}</td>
                <td>${staff.Email}</td>
                <td>${hotels || 'Chưa phân công'}</td>
                <td>${new Date(staff.CreatedAt).toLocaleDateString('vi-VN')}</td>
                <td>
                    <button onclick="openAssignHotelModal(${staff.AccountID})" class="btn btn-sm btn-primary">
                        <i class="fas fa-hotel"></i> Phân công
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Thêm nhân viên
document.getElementById('btn-add-staff')?.addEventListener('click', () => {
    document.getElementById('staff-form').reset();
    document.getElementById('modal-staff').style.display = 'flex';
});

document.getElementById('staff-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('staff-username').value;
    const email = document.getElementById('staff-email').value;
    const password = document.getElementById('staff-password').value;
    
    try {
        const res = await fetchWithAuth('/users/staff', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Lỗi tạo nhân viên');
        }
        
        alert('Tạo nhân viên thành công!');
        document.getElementById('modal-staff').style.display = 'none';
        loadStaff();
    } catch (err) {
        alert(err.message);
    }
});

// Phân công khách sạn
async function openAssignHotelModal(staffId) {
    document.getElementById('assign-staff-id').value = staffId;
    
    // Load danh sách khách sạn
    try {
        const res = await fetchWithAuth('/rooms');
        if (!res.ok) throw new Error('Lỗi tải danh sách khách sạn');
        allHotelsForAssign = await res.json();
        
        const select = document.getElementById('assign-hotel-select');
        select.innerHTML = '<option value="">-- Chọn khách sạn --</option>' +
            allHotelsForAssign.map(h => 
                `<option value="${h.RoomID}">${h.RoomName} - ${h.Address || ''}</option>`
            ).join('');
        
        document.getElementById('modal-assign-hotel').style.display = 'flex';
    } catch (err) {
        alert('Lỗi tải danh sách khách sạn: ' + err.message);
    }
}

document.getElementById('assign-hotel-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const staffId = document.getElementById('assign-staff-id').value;
    const hotelId = document.getElementById('assign-hotel-select').value;
    
    try {
        const res = await fetchWithAuth('/users/staff/assign-hotel', {
            method: 'POST',
            body: JSON.stringify({ staffId: parseInt(staffId), hotelId: parseInt(hotelId) })
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Lỗi phân công khách sạn');
        }
        
        alert('Phân công khách sạn thành công!');
        document.getElementById('modal-assign-hotel').style.display = 'none';
        loadStaff();
    } catch (err) {
        alert(err.message);
    }
});

/* ================= ĐÓNG MODAL CHUNG ================= */
document.querySelectorAll(".close-modal").forEach(btn => {
    btn.onclick = function() { this.closest(".modal").style.display = "none"; }
});
window.onclick = function(e) {
    if (e.target.classList.contains("modal")) e.target.style.display = "none";
}