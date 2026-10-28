# TechNest

**Website bán sản phẩm công nghệ — đồ án môn Thiết kế Web nâng cao.**

TechNest được xây dựng bằng **Node.js, Express, React và MySQL**, hỗ trợ xem sản phẩm, quản lý giỏ hàng, đặt hàng và quản trị danh mục. Dự án sử dụng JWT để xác thực, phân quyền khách hàng/quản trị viên và lưu dữ liệu mua hàng trong MySQL.

Giao diện sử dụng tông trắng, đen và xanh mint, font Be Vietnam Pro, có bố cục đáp ứng cho desktop và điện thoại.

## Mục lục

- [Chức năng](#chức-năng)
- [Công nghệ](#công-nghệ)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Tài khoản mẫu](#tài-khoản-mẫu)
- [Các trang chính](#các-trang-chính)
- [Database và nghiệp vụ đặt hàng](#database-và-nghiệp-vụ-đặt-hàng)
- [API chính](#api-chính)
- [Quản lý ảnh sản phẩm](#quản-lý-ảnh-sản-phẩm)
- [Kiểm thử](#kiểm-thử)
- [Chạy bản build tại máy](#chạy-bản-build-tại-máy)
- [Làm việc nhóm](#làm-việc-nhóm)
- [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)
- [Hướng phát triển](#hướng-phát-triển)

## Chức năng

### Khách truy cập

- Xem danh sách và chi tiết sản phẩm, giá bán, thông số và tồn kho.
- Tìm kiếm theo tên; lọc theo danh mục, thương hiệu và khoảng giá.
- Sắp xếp theo sản phẩm mới nhất hoặc giá tăng/giảm dần; phân trang kết quả.
- Đăng ký và đăng nhập tài khoản.

### Khách hàng đã đăng nhập

- Thêm sản phẩm vào giỏ, cập nhật số lượng và xóa sản phẩm khỏi giỏ.
- Xem tổng số lượng ngay trên menu Giỏ hàng; dữ liệu được đọc từ server.
- Giữ giỏ hàng theo tài khoản trong MySQL, không mất khi tải lại trang.
- Nhập thông tin nhận hàng và đặt hàng theo phương thức **COD**.
- Xem danh sách, chi tiết và trạng thái đơn hàng của chính mình.
- Hủy đơn khi đơn còn ở trạng thái chờ xác nhận.
- Đăng xuất tài khoản.

### Quản trị viên

- Thêm, sửa và bật/tắt hiển thị sản phẩm.
- Quản lý danh mục và thương hiệu.
- Chọn ảnh sản phẩm từ danh sách ảnh có sẵn và xem trước ảnh.
- Xem danh sách, chi tiết đơn hàng và lọc theo trạng thái.
- Xác nhận đơn, chuyển sang đang giao, hoàn tất hoặc hủy theo quy tắc nghiệp vụ.

### Trải nghiệm giao diện

- Header có tìm kiếm, menu theo quyền và số lượng giỏ hàng.
- Trang đăng nhập/đăng ký có bố cục hai cột; thu về một cột trên điện thoại.
- Hiện/ẩn mật khẩu, thông báo lỗi và trạng thái đang xử lý.
- Hiệu ứng trượt khi chuyển giữa cửa hàng và phần tài khoản, có tôn trọng cài đặt giảm chuyển động.
- Sau đăng nhập, người dùng được đưa về trang yêu cầu đăng nhập trước đó.

## Công nghệ

| Thành phần | Công nghệ sử dụng |
|---|---|
| Runtime | Node.js **24.x**, theo `engines` trong package.json |
| Backend | Express **5**, JavaScript CommonJS |
| Frontend | React **19**, React Router **7**, Vite **7** |
| Giao diện | CSS, Be Vietnam Pro, bố cục responsive |
| Database | MySQL, kết nối bằng `mysql2/promise` |
| Xác thực | `jsonwebtoken`, JWT lưu trong cookie HttpOnly |
| Mật khẩu | `bcryptjs` |
| HTTP và cấu hình | Helmet, express-rate-limit, cookie-parser, dotenv |
| Quản lý workspace | npm workspaces; chạy đồng thời bằng concurrently |
| Kiểm thử | Node.js Test Runner, kiểm thử HTTP kết hợp MySQL |

## Cấu trúc dự án

```text
TechNest/
├── client/
│   ├── public/images/              # SVG và ảnh sản phẩm có sẵn
│   ├── src/
│   │   ├── components/             # Header, ProductCard, các component dùng lại
│   │   ├── hooks/                  # Hook theo dõi số lượng giỏ hàng
│   │   ├── pages/                  # Catalog, AuthPage, AdminCatalog
│   │   ├── features/commerce/      # Giỏ hàng, checkout, đơn hàng
│   │   ├── services/api.js         # Gọi API, cookie, thông báo thay đổi giỏ
│   │   ├── auth.jsx                # AuthProvider và Guard
│   │   ├── main.jsx                # Router và bố cục ứng dụng
│   │   └── styles.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── src/
│   │   ├── controllers/            # Xử lý request xác thực và catalog
│   │   ├── models/                 # Truy vấn người dùng, sản phẩm, danh mục
│   │   ├── middlewares/            # Xác thực, phân quyền, kiểm tra request ghi
│   │   ├── routes/                 # Router auth và catalog
│   │   ├── features/commerce/      # API, nghiệp vụ và truy vấn mua hàng
│   │   ├── app.js                  # Tạo Express app, mount route, xử lý lỗi
│   │   ├── server.js               # Khởi động server
│   │   ├── config.js
│   │   ├── db.js
│   │   └── utils.js
│   ├── scripts/                    # Setup database và chạy integration test
│   ├── test/                       # Unit test và integration test
│   ├── .env.example
│   ├── .env.test.example
│   └── package.json
├── database/
│   └── schema.sql                  # Định nghĩa các bảng
├── shared/
│   └── product-images.json         # Danh sách ảnh dùng chung frontend/backend
├── .gitignore
├── package.json                    # Lệnh chạy ở gốc dự án
├── package-lock.json
└── README.md
```

## Cài đặt và chạy

Các lệnh bên dưới dùng **PowerShell trên Windows**, với `npm.cmd` để tránh vướng chính sách chạy file `npm.ps1`. Trên macOS/Linux, dùng `npm` thay `npm.cmd` và dùng lệnh sao chép file tương ứng của hệ điều hành.

### 1. Chuẩn bị môi trường

- Node.js **24.x** và npm đi kèm.
- MySQL Server đang chạy; khuyến nghị MySQL **8.x**.
- Git và trình soạn thảo, ví dụ VS Code.
- MySQL Workbench là công cụ quản lý tùy chọn; ứng dụng kết nối tới **MySQL Server**.

Kiểm tra Node.js và npm:

```powershell
node -v
npm.cmd -v
```

### 2. Clone repository và cài dependencies

```powershell
git clone https://github.com/ducmanh14/TechNest.git
cd TechNest
npm.cmd ci
```

Chạy các lệnh npm tại thư mục gốc có `package.json`, `client`, `server` và `database`. npm workspaces sẽ cài dependencies của cả frontend và backend.

### 3. Tạo cấu hình riêng trên máy

Lần đầu cài đặt, sao chép file mẫu:

```powershell
Copy-Item server\.env.example server\.env
```

Mở `server/.env` và điền thông tin MySQL cùng khóa JWT. Các biến chính:

| Biến | Giá trị mặc định / ý nghĩa |
|---|---|
| `PORT` | `3000` — cổng backend |
| `APP_ORIGIN` | `http://localhost:5173` — origin frontend khi chạy dev |
| `DB_HOST` | `127.0.0.1` |
| `DB_PORT` | `3306` — phải trùng cổng MySQL trên máy |
| `DB_USER` | Tài khoản MySQL trên máy; mẫu là `root` |
| `DB_PASSWORD` | Mật khẩu của tài khoản MySQL đó |
| `DB_NAME` | `technest_course` |
| `JWT_SECRET` | Khóa riêng, ít nhất 32 byte; cần tự tạo |
| `JWT_EXPIRES_IN` | `30m` |
| `JWT_ISSUER` | `technest` |
| `JWT_AUDIENCE` | `technest-web` |
| `NODE_ENV` | `development` khi chạy dev tại máy |

Tạo chuỗi ngẫu nhiên để điền vào `JWT_SECRET`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy kết quả vào sau dấu `=` của `JWT_SECRET` trong `server/.env`, rồi lưu file. Mật khẩu MySQL, mật khẩu tài khoản TechNest và JWT_SECRET là các thông tin khác nhau.

Mỗi thành viên có file `.env` riêng. Không commit `.env` hoặc `.env.test`; repository chỉ lưu các file `.example`. Nếu cấu hình đã tồn tại, sửa file đang có thay vì sao chép đè lại từ mẫu.

### 4. Khởi tạo database

Đảm bảo MySQL Server đang chạy và tài khoản đã cấu hình có quyền tạo database, bảng và thao tác dữ liệu. Tại thư mục gốc, chạy:

```powershell
npm.cmd run db:setup
```

Script sẽ:

1. Tạo database theo `DB_NAME` nếu chưa có.
2. Đọc `database/schema.sql` để tạo bảng.
3. Thêm tài khoản demo nếu chưa tồn tại.
4. Thêm danh mục, thương hiệu và 24 sản phẩm mẫu.

Không cần tự chạy lại các đoạn SQL trong Workbench nếu dùng cách setup này. Script dùng `IF NOT EXISTS` và `INSERT IGNORE`; việc chạy lại không thay thế một hệ thống migration và không cập nhật đè các sản phẩm đã có.

**Lưu ý về dữ liệu mẫu:** sản phẩm được seed ban đầu dùng ảnh SVG. Bộ ảnh studio đã nằm trong repository, nhưng muốn dùng cho từng sản phẩm thì cần chọn và lưu ảnh ở trang quản trị.

### 5. Chạy chế độ phát triển

```powershell
npm.cmd run dev
```

| Địa chỉ | Chức năng |
|---|---|
| `http://localhost:5173` | Giao diện React/Vite |
| `http://localhost:3000/api/health` | Kiểm tra backend và kết nối database |
| `http://localhost:5173/api/health` | Kiểm tra API qua proxy của Vite |

Vite chuyển request `/api` tới backend tại `http://127.0.0.1:3000`.

Kết quả health mong đợi khi database kết nối được và module commerce có mặt:

```json
{
  "success": true,
  "data": {
    "database": "connected",
    "commerce": true
  }
}
```

Endpoint này kiểm tra kết nối MySQL và sự tồn tại của module commerce; vẫn cần kiểm tra riêng các thao tác giỏ hàng và đặt hàng.

Khi chạy dev, truy cập bằng **localhost** và giữ `APP_ORIGIN=http://localhost:5173`. Dùng địa chỉ khác mà chưa đổi cấu hình có thể khiến các request ghi bị từ chối.

## Tài khoản mẫu

Sau khi setup trên database mới:

| Vai trò | Tên đăng nhập | Mật khẩu demo |
|---|---|---|
| Quản trị viên | `admin` | `TechNest@123` |
| Khách hàng | `khach` | `TechNest@123` |

Các thông tin trên thuộc dữ liệu seed phục vụ học tập. Nếu tài khoản đã tồn tại và được đổi mật khẩu, chạy lại setup không đặt lại mật khẩu đó. Không sử dụng tài khoản demo mặc định cho một dịch vụ công khai thực tế.

## Các trang chính

| Đường dẫn | Nội dung | Quyền truy cập |
|---|---|---|
| `/` | Danh sách sản phẩm, tìm kiếm và bộ lọc | Công khai |
| `/products/:id` | Chi tiết sản phẩm | Công khai |
| `/login` | Đăng nhập | Công khai |
| `/register` | Đăng ký | Công khai |
| `/cart` | Giỏ hàng | Đã đăng nhập |
| `/checkout` | Thông tin nhận hàng và đặt hàng | Đã đăng nhập |
| `/orders` | Đơn của tôi | Đã đăng nhập |
| `/orders/:id` | Chi tiết đơn của chính mình | Đã đăng nhập |
| `/admin/catalog` | Quản lý sản phẩm, danh mục, thương hiệu | Admin |
| `/admin/orders` | Quản lý đơn hàng | Admin |
| `/admin/orders/:id` | Chi tiết và cập nhật trạng thái đơn | Admin |

## Database và nghiệp vụ đặt hàng

### Các bảng

| Bảng | Vai trò |
|---|---|
| `users` | Tài khoản, mật khẩu đã băm, vai trò và phiên bản xác thực |
| `categories` | Danh mục sản phẩm |
| `brands` | Thương hiệu |
| `products` | Sản phẩm, giá, tồn kho, thông số JSON và ảnh chính |
| `product_images` | Cấu trúc lưu ảnh bổ sung; giao diện hiện sử dụng ảnh chính ở products.image_path |
| `cart_items` | Sản phẩm và số lượng trong giỏ của từng tài khoản |
| `orders` | Thông tin nhận hàng, tổng tiền, trạng thái và khóa chống tạo đơn trùng |
| `order_items` | Chi tiết đơn, lưu tên/SKU/đơn giá tại thời điểm đặt |

### Quy tắc mua hàng

- Số lượng mỗi sản phẩm trong giỏ từ **1 đến 99**, đồng thời không vượt tồn kho; tối đa **50 dòng sản phẩm** trong một giỏ.
- Server tự đọc giá và tồn kho từ MySQL, không lấy tổng tiền do frontend gửi lên làm căn cứ tạo đơn.
- Phí giao hàng mẫu là **30.000 đồng** khi giỏ có sản phẩm.
- Phiên bản hiện tại hỗ trợ **COD — thanh toán khi nhận hàng**.
- Khi tạo đơn thành công, server trừ tồn kho và xóa các dòng giỏ trong transaction.
- Đơn hàng lưu lại thông tin sản phẩm tại thời điểm mua; sửa tên hoặc giá sản phẩm sau đó không thay đổi nội dung lịch sử đơn đã lưu.
- Checkout sử dụng `checkout_key` và `cart_signature` để kiểm tra lần gửi lại và thay đổi của giỏ. Frontend giữ yêu cầu đang chờ trong sessionStorage để có thể gửi lại cùng lần đặt.
- Khách hàng chỉ được xem đơn của mình; các thao tác quản trị được kiểm tra quyền tại backend.

### Trạng thái đơn hàng

```text
pending → confirmed → shipping → delivered
   └────────→ cancelled
                 ↑
confirmed ────────┘
```

| Trạng thái | Ý nghĩa |
|---|---|
| `pending` | Chờ xác nhận |
| `confirmed` | Đã xác nhận |
| `shipping` | Đang giao |
| `delivered` | Đã giao; COD được ghi nhận đã thu tiền |
| `cancelled` | Đã hủy |

Khách hàng được hủy đơn `pending`. Admin được hủy đơn `pending` hoặc `confirmed`. Khi hủy hợp lệ, tồn kho được hoàn lại; gửi lại yêu cầu hủy không hoàn kho thêm lần nữa.

### Xác thực và kiểm tra request

- JWT dùng thuật toán HS256, kiểm tra hạn dùng, issuer, audience và phiên bản xác thực của tài khoản.
- Token được lưu trong cookie **HttpOnly**, không lưu JWT trong localStorage.
- Cookie có SameSite=Lax; Secure được bật khi `NODE_ENV=production`.
- Mật khẩu được băm bằng bcrypt.
- Đăng xuất tăng `auth_version`, làm các JWT đã phát hành trước đó của tài khoản mất hiệu lực.
- Request ghi cần Origin hợp lệ, `Content-Type: application/json` và header `X-TechNest-Client: web`.
- Route đăng nhập/đăng ký có giới hạn tần suất; Helmet cung cấp các HTTP header bảo vệ.

## API chính

Tất cả endpoint bên dưới có tiền tố **`/api`**. API trả dữ liệu dưới khóa `data`; danh sách phân trang có thêm `meta`. Lỗi trả `success: false`, `message` và có thể có `code`.

### Công khai và xác thực

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/health` | Kiểm tra backend/database |
| POST | `/auth/register` | Đăng ký tài khoản customer |
| POST | `/auth/login` | Đăng nhập và đặt cookie JWT |
| GET | `/auth/me` | Thông tin tài khoản hiện tại |
| POST | `/auth/logout` | Đăng xuất, thu hồi JWT đã phát hành |
| GET | `/products` | Danh sách sản phẩm |
| GET | `/products/:id` | Chi tiết sản phẩm |
| GET | `/categories` | Danh mục đang hoạt động |
| GET | `/brands` | Thương hiệu đang hoạt động |

Ví dụ lọc sản phẩm:

```text
/api/products?q=laptop&category=1&minPrice=10000000&sort=price_asc&page=1&limit=12
```

Các tham số hỗ trợ: `q`, `category`, `brand`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`. `category` và `brand` là ID trong database. `sort` nhận `newest`, `price_asc`, `price_desc`.

### Giỏ hàng và đơn hàng

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/cart` | Đọc giỏ của tài khoản hiện tại |
| POST | `/cart/items` | Thêm sản phẩm với product_id và quantity |
| PUT | `/cart/items/:id` | Cập nhật quantity của một dòng giỏ |
| DELETE | `/cart/items/:id` | Xóa một dòng giỏ |
| POST | `/orders` | Tạo đơn hàng hoặc xử lý gửi lại cùng checkout_key |
| GET | `/orders` | Danh sách đơn của tài khoản hiện tại |
| GET | `/orders/:id` | Chi tiết đơn của tài khoản hiện tại |
| POST | `/orders/:id/cancel` | Hủy đơn theo điều kiện cho phép |

Ở `/cart/items/:id`, `id` là **ID dòng giỏ hàng**, không phải ID sản phẩm.

### Quản trị

| Method | Endpoint | Chức năng |
|---|---|---|
| GET / POST | `/admin/products` | Danh sách / thêm sản phẩm |
| PUT | `/admin/products/:id` | Sửa sản phẩm; gửi kèm expected_stock |
| PATCH | `/admin/products/:id/status` | Bật/tắt hiển thị sản phẩm |
| GET / POST | `/admin/categories` | Danh sách / thêm danh mục |
| PUT | `/admin/categories/:id` | Sửa tên và trạng thái danh mục |
| GET / POST | `/admin/brands` | Danh sách / thêm thương hiệu |
| PUT | `/admin/brands/:id` | Sửa tên và trạng thái thương hiệu |
| GET | `/admin/orders` | Danh sách đơn; hỗ trợ lọc status |
| GET | `/admin/orders/:id` | Chi tiết đơn |
| PATCH | `/admin/orders/:id/status` | Cập nhật trạng thái đơn |

Nếu dùng Postman hoặc công cụ tương tự để thử request ghi, thêm các header:

```http
Origin: http://localhost:5173
Content-Type: application/json
X-TechNest-Client: web
```

Giữ cookie nhận được từ đăng nhập cho những endpoint yêu cầu xác thực. Frontend đã xử lý cookie và các header này trong `client/src/services/api.js`.

## Quản lý ảnh sản phẩm

Ảnh nằm trong `client/public/images/products`; danh sách lựa chọn dùng chung nằm tại `shared/product-images.json`. Ảnh studio trong repo là ảnh minh họa do AI tạo, không phải ảnh chụp chính thức của nhà sản xuất.

Để thêm ảnh mới:

1. Chuẩn bị ảnh vuông **1:1**, khuyến nghị **1200 × 1200 px**; đặt sản phẩm giữa khung, không kéo giãn hoặc cắt mất thiết bị.
2. Dùng PNG, JPG hoặc WebP; ưu tiên dung lượng nhẹ cho web.
3. Copy ảnh vào `client/public/images/products`, đặt tên không dấu, không có khoảng trắng và giữ đúng định dạng thật.
4. Thêm một object vào mảng `products` của `shared/product-images.json`, ví dụ:

```json
{
  "label": "Bàn phím cơ — ảnh mới",
  "path": "/images/products/24-ban-phim-co.webp",
  "categories": []
}
```

5. Lưu file và khởi động lại dev để backend đọc lại danh sách.
6. Vào trang quản trị, thêm/sửa sản phẩm, chọn ảnh và lưu.
7. Commit cả file ảnh và JSON nếu muốn chia sẻ tài nguyên cho thành viên khác.

Trường `categories` phục vụ ánh xạ ảnh đại diện danh mục; để `[]` nếu chỉ thêm lựa chọn ảnh sản phẩm. Thêm ảnh vào JSON không tự tạo danh mục hoặc sản phẩm trong MySQL.

Hiện tại đây là cơ chế **chọn ảnh có sẵn**, chưa có chức năng upload file qua trang admin. Backend kiểm tra PNG/JPG/WebP mới theo các đường dẫn đã khai báo trong danh sách dùng chung; các đường dẫn SVG hợp lệ vẫn được hỗ trợ.

## Kiểm thử

### Các lệnh ở thư mục gốc

| Lệnh | Tác dụng |
|---|---|
| `npm.cmd run dev` | Chạy frontend và backend ở chế độ phát triển |
| `npm.cmd run db:setup` | Tạo database/schema và dữ liệu mẫu |
| `npm.cmd run build` | Build frontend vào client/dist |
| `npm.cmd start` | Chạy Express; phục vụ frontend nếu đã có client/dist |
| `npm.cmd test` | Chạy unit test phía server |
| `npm.cmd run test:integration` | Setup database test và chạy kiểm thử HTTP + MySQL |

### Integration test

Lần đầu, tạo file cấu hình riêng:

```powershell
Copy-Item server\.env.test.example server\.env.test
```

Điền thông tin MySQL và tạo `JWT_SECRET` riêng cho file test. Giữ:

```dotenv
DB_NAME=technest_course_test
```

Sau đó chạy:

```powershell
npm.cmd test
npm.cmd run test:integration
```

Integration test tạo/sửa dữ liệu để kiểm tra xác thực, phân quyền, sản phẩm, giỏ hàng và nghiệp vụ đơn hàng. **Chỉ dùng database riêng có tên kết thúc bằng `_test`**, không dùng database chứa dữ liệu cần giữ. Script có kiểm tra hậu tố này trước khi chạy.

### Checklist kiểm tra giao diện

- [ ] Đăng ký, đăng nhập đúng/sai, hiện/ẩn mật khẩu và đăng xuất.
- [ ] Tìm kiếm, lọc, sắp xếp và phân trang sản phẩm.
- [ ] Thêm/tăng/giảm/xóa giỏ; số trên header cập nhật đúng và giữ sau F5.
- [ ] Không thêm được số lượng vượt tồn kho.
- [ ] Đặt COD thành công; giỏ được cập nhật và đơn xuất hiện trong Đơn của tôi.
- [ ] Khách không truy cập được API quản trị hoặc đơn của tài khoản khác.
- [ ] Hủy đơn đúng điều kiện; admin chuyển trạng thái đúng thứ tự.
- [ ] Sửa ảnh trong admin, tải lại trang chủ và chi tiết vẫn hiện đúng ảnh.
- [ ] Kiểm tra desktop, điện thoại và điều hướng giữa cửa hàng/tài khoản.

Các lệnh test và checklist là hướng dẫn tự kiểm tra; README không thay thế kết quả chạy test trên môi trường cụ thể.

## Chạy bản build tại máy

Để xem frontend do Express phục vụ trực tiếp trên cổng 3000:

1. Dừng các tiến trình dev bằng Ctrl+C.
2. Sửa `server/.env`: đặt `APP_ORIGIN=http://localhost:3000`, giữ `PORT=3000`.
3. Với bản chạy thử bằng HTTP localhost này, giữ `NODE_ENV=development`.
4. Chạy:

```powershell
npm.cmd run build
npm.cmd start
```

Mở `http://localhost:3000`. Khi quay lại Vite dev, đổi `APP_ORIGIN` về `http://localhost:5173` rồi khởi động lại server.

Đây là hướng dẫn chạy bản build cục bộ. Triển khai thực tế cần cấu hình domain, HTTPS, origin và biến môi trường tương ứng; cookie Secure được bật trong chế độ production.

## Làm việc nhóm

Nhóm gồm hai thành viên, cùng tham gia frontend và backend:

| Giai đoạn | Phạm vi chính |
|---|---|
| Nền tảng dự án | Cấu trúc workspace, MySQL, xác thực JWT, catalog và quản trị sản phẩm |
| Nghiệp vụ mua hàng | Giỏ hàng, checkout COD, đơn hàng và quản trị trạng thái đơn |
| Hoàn thiện | Tích hợp, kiểm thử, giao diện, ảnh sản phẩm và trải nghiệm tài khoản |

Contributor: [ducmanh14](https://github.com/ducmanh14), [ducmanh-23](https://github.com/ducmanh-23).

Quy trình Git: tạo nhánh cho phần việc → commit → push → tạo Pull Request vào `main` → kiểm tra thay đổi → merge → các thành viên cập nhật `main`.

Khi không còn thay đổi cục bộ cần xử lý, cập nhật bản đã merge bằng:

```powershell
git switch main
git pull --ff-only origin main
```

Sau khi pull, chạy `npm.cmd ci` nếu dependencies hoặc package-lock thay đổi. Mỗi máy cần MySQL và file `.env` riêng.

**Git đồng bộ mã nguồn và file ảnh, không đồng bộ dữ liệu MySQL.** Tên, giá, ảnh được gán cho sản phẩm và đơn hàng đã tạo trên một máy không tự xuất hiện ở máy còn lại. Muốn có cùng dữ liệu trình diễn, cần thống nhất dữ liệu seed hoặc thực hiện export/import database riêng sau khi kiểm tra nội dung cần chia sẻ.

## Xử lý lỗi thường gặp

| Hiện tượng | Cách kiểm tra |
|---|---|
| `EBADENGINE` | Kiểm tra `node -v`; dự án yêu cầu Node 24.x. |
| PowerShell chặn npm.ps1 | Dùng npm.cmd như các lệnh trong README. |
| `ECONNREFUSED` khi kết nối MySQL | Kiểm tra MySQL Server đang chạy và DB_HOST/DB_PORT đúng. |
| `ER_ACCESS_DENIED_ERROR` | Kiểm tra DB_USER, DB_PASSWORD và quyền của tài khoản MySQL. |
| Database hoặc bảng chưa tồn tại | Kiểm tra .env rồi chạy npm.cmd run db:setup. |
| Server báo JWT_SECRET quá ngắn | Tạo khóa ngẫu nhiên rồi điền JWT_SECRET; khởi động lại backend. |
| HTTP 403 khi đăng nhập hoặc ghi dữ liệu | Kiểm tra APP_ORIGIN, địa chỉ trình duyệt và header X-TechNest-Client. |
| Trang localhost:5173 không truy cập được | Kiểm tra npm.cmd run dev và thông báo trong terminal. |
| Cổng 5173/3000 bị chiếm | Dừng tiến trình chạy trùng hoặc chỉnh cấu hình liên quan cho đồng bộ. |
| HTTP 401 ở trang cần đăng nhập | Đăng nhập lại; JWT có hạn dùng và bị thu hồi khi đăng xuất. |
| HTTP 409 khi sửa sản phẩm | Tồn kho có thể vừa thay đổi; tải lại dữ liệu rồi mở form sửa lại. |
| Ảnh mới bị vỡ hoặc không lưu được | Kiểm tra tên file, đường dẫn trong JSON, ảnh đã được commit và server đã khởi động lại. |
| Clone về không giống dữ liệu sản phẩm trên máy khác | MySQL không được đồng bộ qua Git; kiểm tra dữ liệu seed hoặc dữ liệu đã nhập. |

## Hướng phát triển

Các chức năng sau là định hướng mở rộng, **chưa có trong phiên bản hiện tại**:

- Upload ảnh sản phẩm trực tiếp từ trang quản trị.
- Quên mật khẩu và đặt lại mật khẩu qua email.
- Tích hợp thanh toán trực tuyến.
- Dashboard doanh thu và thống kê.
- Đánh giá sản phẩm, mã giảm giá và danh sách yêu thích.

---

Dự án phục vụ học tập và trình diễn nghiệp vụ thương mại điện tử. Thông tin sản phẩm, giá và hình ảnh mẫu dùng để minh họa.
