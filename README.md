# ⭐ Favorite Stocks Watcher 📈

📝 **Giới thiệu**

FavoriteStocksWatcher là một ứng dụng web giúp người dùng theo dõi các mã cổ phiếu yêu thích một cách tiện lợi. Người dùng có thể đăng ký, đăng nhập, quản lý danh sách cổ phiếu cá nhân (thêm, xem, xóa), và chia sẻ danh sách của mình với những người dùng khác trong hệ thống. Ứng dụng cũng cho phép xem các danh sách được chia sẻ từ người khác.

---

🛠️ **Công nghệ sử dụng**

💻 **Frontend (React + Vite)**

-   ReactJS (với Hooks & Context API)
-   Vite làm công cụ build và dev server
-   React Router cho việc điều hướng trang
-   Material UI (MUI) cho các thành phần giao diện người dùng
-   Axios để thực hiện các yêu cầu HTTP đến API
-   Jest & React Testing Library để kiểm thử

🌐 **Backend (Node.js + Express.js)**

-   Node.js làm môi trường chạy phía máy chủ
-   Express.js làm framework web
-   MongoDB làm cơ sở dữ liệu NoSQL
-   Mongoose làm ODM (Object Data Modeling) cho MongoDB
-   JWT (JSON Web Tokens) để xác thực người dùng
-   Passport.js cho chiến lược xác thực JWT
-   bcryptjs để mã hóa mật khẩu
-   Jest & Supertest để kiểm thử API

---

⚙️ **Tính năng chính**

-   ✅ **Xác thực người dùng:**
    -   Đăng ký tài khoản mới.
    -   Đăng nhập với tài khoản hiện có.
    -   Đăng xuất an toàn.
-   ✅ **Quản lý danh sách cổ phiếu yêu thích:**
    -   Thêm mã cổ phiếu mới vào danh sách (ví dụ: `AAPL`, `GOOGL`).
    -   Xem danh sách các mã cổ phiếu đã lưu.
    -   Xóa mã cổ phiếu khỏi danh sách.
-   ✅ **Chia sẻ danh sách cổ phiếu:**
    -   Tìm kiếm người dùng khác theo tên người dùng.
    -   Chia sẻ danh sách cổ phiếu yêu thích của bạn với người dùng được chọn.
    -   Xem danh sách các lượt chia sẻ bạn đã tạo và thu hồi quyền truy cập nếu cần.
-   ✅ **Xem danh sách được chia sẻ:**
    -   Xem các danh sách cổ phiếu mà người dùng khác đã chia sẻ với bạn.
-   📱 **Giao diện người dùng:**
    -   Thiết kế đáp ứng (Responsive Design).
    -   Sử dụng Material UI cho giao diện hiện đại và nhất quán.

---

📂 **Cấu trúc thư mục**

Dự án được tổ chức thành hai thư mục chính: `backend` cho mã nguồn phía máy chủ và `frontend` cho mã nguồn phía máy khách.

FavoriteStocksWatcher/
├── backend/                  # Dự án Node.js + Express.js
│
├── frontend/                 # Dự án React + Vite

---

⚙️ **Hướng dẫn cài đặt và chạy dự án**

⚠️ **Yêu cầu môi trường**

-   Node.js (khuyến nghị phiên bản LTS, ví dụ: 18.x hoặc 20.x)
-   npm 
-   MongoDB (đảm bảo server MongoDB đang chạy local hoặc bạn có URI kết nối)
-   Git

1️⃣ **Clone dự án**
git clone https://github.com/NguyenChiCuong-2180603333/FavoriteStocksWatcher.git
cd FavoriteStocksWatcher

🧩 Thiết lập Backend (Node.js + Express.js)

Điều hướng vào thư mục backend:
cd backend
Cài đặt các gói phụ thuộc:
npm install

Thiết lập biến môi trường:
Tạo một tệp .env trong thư mục backend/ và cấu hình các biến sau:

Đoạn mã

PORT=3000
MONGO_URI=mongodb://localhost:27017/favoritestocks # Hoặc URI MongoDB của bạn
JWT_SECRET=your_very_strong_jwt_secret_key # Thay bằng một chuỗi bí mật mạnh
FINNHUB_AP= your_key
Chạy Backend server:

npm run dev
Server backend sẽ chạy tại http://localhost:3000 (hoặc cổng bạn đặt trong .env).

💻 Thiết lập Frontend (React + Vite)

Điều hướng vào thư mục frontend (từ thư mục gốc của dự án):
cd ../frontend

Cài đặt các gói phụ thuộc:

npm install

Thiết lập biến môi trường:
Tạo một tệp .env trong thư mục frontend/ và cấu hình biến sau:

Đoạn mã

VITE_API_BASE_URL=http://localhost:3000/api

Chạy Frontend application:

npm run dev
Ứng dụng frontend sẽ chạy tại http://localhost:5173 .
