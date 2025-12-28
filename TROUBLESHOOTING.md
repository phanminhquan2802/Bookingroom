# 🔧 HƯỚNG DẪN KHẮC PHỤC LỖI

## Lỗi 404 khi load RoomTypes

### Nguyên nhân:
1. **Bảng RoomTypes chưa được tạo** - Chưa chạy migration
2. **Server chưa được restart** - Route mới chưa được load
3. **Database chưa có dữ liệu** - Chưa insert RoomTypes

### Cách khắc phục:

#### Bước 1: Kiểm tra Server đang chạy
```bash
# Dừng server (Ctrl+C) và khởi động lại
cd Book-hotel
node server.js
```

#### Bước 2: Chạy các file migration theo thứ tự

1. **Tạo bảng RoomTypes:**
```sql
SOURCE migrations/04_create_room_types_table.sql;
```

2. **Tạo bảng Amenities:**
```sql
SOURCE migrations/05_create_amenities_table.sql;
```

3. **Tạo bảng RoomAmenities:**
```sql
SOURCE migrations/06_create_room_amenities_table.sql;
```

4. **Thêm dữ liệu RoomTypes:**
```sql
SOURCE migrations/07_insert_room_types_sample.sql;
```

5. **Gán tiện nghi cho phòng:**
```sql
SOURCE migrations/08_insert_room_amenities_sample.sql;
```

#### Bước 3: Kiểm tra dữ liệu

```sql
-- Kiểm tra RoomTypes
SELECT COUNT(*) FROM RoomTypes;

-- Kiểm tra Amenities
SELECT COUNT(*) FROM Amenities;

-- Kiểm tra RoomAmenities
SELECT COUNT(*) FROM RoomAmenities;

-- Kiểm tra RoomTypes theo Hotel
SELECT RT.*, R.RoomName 
FROM RoomTypes RT
JOIN Rooms R ON RT.HotelID = R.RoomID
LIMIT 5;
```

#### Bước 4: Test API

Mở browser và truy cập:
```
http://localhost:3000/api/hotels/1/roomtypes
```

Kết quả mong đợi: JSON array với các RoomTypes

## Lỗi "Unexpected token '<'"

### Nguyên nhân:
Server trả về HTML (404 page) thay vì JSON

### Cách khắc phục:

1. **Kiểm tra route đã được đăng ký:**
   - Mở `server.js`
   - Kiểm tra dòng: `app.use('/api', roomTypeRoutes);`

2. **Kiểm tra file route tồn tại:**
   - `routes/roomTypeRoutes.js` phải tồn tại
   - `controllers/roomTypeController.js` phải tồn tại

3. **Restart server:**
```bash
# Dừng server (Ctrl+C)
node server.js
```

4. **Kiểm tra console log:**
   - Xem có lỗi khi start server không
   - Xem có lỗi khi gọi API không

## Lỗi Database

### Lỗi: "Table 'RoomTypes' doesn't exist"

**Giải pháp:** Chạy migration file `04_create_room_types_table.sql`

### Lỗi: "Column 'HotelID' cannot be null"

**Giải pháp:** Đảm bảo RoomTypes có HotelID hợp lệ (tham chiếu đến Rooms.RoomID)

### Lỗi: "Foreign key constraint fails"

**Giải pháp:** 
- Kiểm tra Rooms có dữ liệu chưa
- Đảm bảo HotelID trong RoomTypes tồn tại trong Rooms

## Kiểm tra nhanh

### 1. Test API endpoint:
```bash
curl http://localhost:3000/api/hotels/1/roomtypes
```

### 2. Kiểm tra database:
```sql
SHOW TABLES LIKE 'RoomTypes';
DESCRIBE RoomTypes;
SELECT * FROM RoomTypes LIMIT 1;
```

### 3. Kiểm tra console:
- Mở Developer Tools (F12)
- Tab Console xem có lỗi JavaScript không
- Tab Network xem request/response

## Thứ tự chạy migration đúng:

1. `01_insert_categories.sql`
2. `02_update_rooms_schema.sql`
3. `03_insert_hotels_as_rooms.sql`
4. `04_create_room_types_table.sql`
5. `05_create_amenities_table.sql`
6. `06_create_room_amenities_table.sql`
7. `07_insert_room_types_sample.sql`
8. `08_insert_room_amenities_sample.sql`

## Liên hệ hỗ trợ

Nếu vẫn gặp lỗi, kiểm tra:
1. ✅ Server đang chạy
2. ✅ Database connection OK
3. ✅ Đã chạy tất cả migration
4. ✅ Route đã được đăng ký
5. ✅ File controller tồn tại

