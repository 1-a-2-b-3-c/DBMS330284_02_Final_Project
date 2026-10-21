# Hệ thống quản lý ký túc xá

Ứng dụng web hỗ trợ quản lý hoạt động ký túc xá và cung cấp cổng dịch vụ cho sinh viên. Dự án gồm frontend React, backend ASP.NET Core Web API và cơ sở dữ liệu Microsoft SQL Server.

## Mục lục

- [Tổng quan chức năng](#tổng-quan-chức-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Cài đặt cơ sở dữ liệu](#cài-đặt-cơ-sở-dữ-liệu)
- [Cấu hình và chạy backend](#cấu-hình-và-chạy-backend)
- [Cấu hình và chạy frontend](#cấu-hình-và-chạy-frontend)
- [Đăng nhập và phân quyền](#đăng-nhập-và-phân-quyền)
- [Lệnh build và kiểm tra](#lệnh-build-và-kiểm-tra)
- [Cấu trúc dự án](#cấu-trúc-dự-án)

## Tổng quan chức năng

- **Cổng sinh viên:** xem và cập nhật một số thông tin hồ sơ, tra cứu phòng đang ở, gửi đăng ký ký túc xá, xem hợp đồng và hóa đơn, ghi nhận thanh toán theo API hiện có.
- **Quản lý ký túc xá:** tra cứu phòng và sinh viên, quản lý hồ sơ sinh viên, duyệt đăng ký và xếp phòng, tra cứu/kết thúc hợp đồng, lập biên bản và xử lý vi phạm.
- **Quản lý tài chính:** quản lý danh mục khoản thu, lập và tra cứu hóa đơn, quản lý công nợ/quá hạn, xem doanh thu, tra cứu lịch sử và ghi nhận thanh toán.
- **Quản trị viên:** tra cứu tài khoản, tạo tài khoản quản lý, khóa/mở khóa tài khoản và đặt lại mật khẩu.
- **Xác thực và phân quyền:** đăng nhập bằng tài khoản lưu trong SQL Server; backend phát hành JWT và kiểm tra vai trò trên các API nghiệp vụ.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Giao diện | React 19, TypeScript, Vite 8, React Router, Tailwind CSS |
| Gọi API | Axios |
| Backend | ASP.NET Core Web API, .NET 10 |
| Bảo mật đăng nhập | JWT Bearer, BCrypt |
| Cơ sở dữ liệu | Microsoft SQL Server |

## Yêu cầu môi trường

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0).
- [Node.js và npm](https://nodejs.org/) tương thích với Vite 8.
- SQL Server (ví dụ SQL Server Express) và SSMS hoặc một công cụ quản lý SQL Server tương đương.
- Git để tải mã nguồn.

Các lệnh bên dưới dùng cú pháp PowerShell trên Windows. Trên macOS/Linux, thay `cd backend` và `cd frontend` bằng đường dẫn tương ứng của hệ điều hành.

## Cài đặt cơ sở dữ liệu

1. Khởi động SQL Server và mở SSMS.
2. Mở script [`database/QuanLyKTX_Frontend_FULL.sql`](database/QuanLyKTX_Frontend_FULL.sql).
3. Kiểm tra phần `CREATE DATABASE` ở đầu script. Tệp dữ liệu mặc định được đặt dưới `C:\DBMS\DATA`; nếu thư mục này không tồn tại hoặc SQL Server không có quyền ghi vào đó, hãy sửa các giá trị `FILENAME` trong script thành thư mục dữ liệu hợp lệ trên máy.
4. Chạy script để tạo database `QuanLyKTX_Frontend`, các đối tượng database và dữ liệu mẫu được khai báo trong script.
5. Đảm bảo tài khoản SQL Server mà backend sử dụng có quyền truy cập database vừa tạo.

> Script tạo database không nên được chạy lại tùy tiện trên database đang có dữ liệu. Hãy xem nội dung script và sao lưu dữ liệu trước khi chạy lại hoặc thay đổi database.

### Script phân quyền SQL Server

[`database/Role_Login.sql`](database/Role_Login.sql) là script riêng để tạo login/user/role ở cấp SQL Server và cấp quyền trên một số đối tượng. Script này **không bắt buộc** cho cấu hình backend mặc định dùng Windows Integrated Security.

Đọc kỹ toàn bộ script trước khi chạy: ngoài phần tạo login/user/role, phía cuối còn có khối `UNDO` thu hồi quyền và xóa các đối tượng vừa tạo. Nếu chỉ cần thiết lập quyền, không chạy nguyên script một cách máy móc; chọn đúng các đoạn cần thiết. Script cũng có mật khẩu mẫu yếu, chỉ thích hợp cho môi trường thử nghiệm cục bộ sau khi đã được rà soát và thay đổi.

## Cấu hình và chạy backend

Mở terminal tại thư mục gốc repository:

```powershell
cd backend
dotnet restore
dotnet build
```

Backend đọc cấu hình `ConnectionStrings:Default` và `Jwt:Key`. Nên lưu giá trị riêng của máy bằng .NET User Secrets thay vì đưa thông tin kết nối hoặc khóa ký JWT vào Git:

```powershell
# Chỉ cần chạy một lần cho project backend
dotnet user-secrets init

# Ví dụ cho SQL Server Express dùng Windows Authentication
dotnet user-secrets set "ConnectionStrings:Default" "Server=localhost\SQLEXPRESS;Database=QuanLyKTX_Frontend;Integrated Security=True;TrustServerCertificate=True;"

# Thay bằng khóa ngẫu nhiên riêng, dài tối thiểu 32 ký tự
dotnet user-secrets set "Jwt:Key" "thay-bang-khoa-bi-mat-rieng-dai-it-nhat-32-ky-tu"
```

Nếu SQL Server chạy ở instance khác, thay phần `Server=...`. Nếu dùng SQL Server Authentication thay cho Windows Authentication, cập nhật connection string theo cấu hình của máy và không chia sẻ mật khẩu.

Chạy backend bằng profile HTTP:

```powershell
dotnet run --launch-profile http
```

Profile hiện tại chạy tại `http://localhost:5272`. Profile HTTPS được khai báo trong `backend/Properties/launchSettings.json` và sử dụng cổng HTTPS `7067`.

Kiểm tra kết nối SQL Server bằng cách truy cập:

```text
http://localhost:5272/api/ping-db
```

Khi kết nối thành công, API trả về thông báo `Kết nối SQL Server thành công!`. Nếu backend không khởi động được, hãy kiểm tra lỗi cấu hình và kết nối trong terminal.

## Cấu hình và chạy frontend

Mở terminal thứ hai tại thư mục gốc repository:

```powershell
cd frontend
npm install
npm run dev
```

Vite chạy frontend tại `http://localhost:5173`. Mặc định Axios gọi backend ở `http://localhost:5272`.

Nếu backend dùng địa chỉ khác, tạo file `frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:5272
```

Khởi động lại Vite sau khi thay đổi biến môi trường. Biến `VITE_API_BASE_URL` là cấu hình phía trình duyệt, không dùng để lưu mật khẩu, khóa JWT hoặc thông tin bí mật.

### Chạy cả hai phần

Giữ backend chạy trong terminal thứ nhất và frontend chạy trong terminal thứ hai. Sau đó mở `http://localhost:5173` trong trình duyệt. Giao diện đăng nhập nằm tại `/login`.

## Đăng nhập và phân quyền

Script [`database/QuanLyKTX_Frontend_FULL.sql`](database/QuanLyKTX_Frontend_FULL.sql) tạo các tài khoản thử sau:

| Mã tài khoản | Tên đăng nhập | Mật khẩu | Vai trò | Ghi chú |
| --- | --- | --- | --- | --- |
| `ADMIN01` | `admin` | `123456` | `ADMIN` | Quản trị viên |
| `QLKTX01` | `quanlyktx` | `123456` | `QLKTX` | Quản lý ký túc xá |
| `QLTC01` | `quanlytaichinh` | `123456` | `QLTC` | Quản lý tài chính |
| `SV001` | `SV001` | `SV001` | `SV` | Tài khoản sinh viên mẫu |

Mật khẩu được xác minh từ các BCrypt hash trong script database. Không sử dụng phiên mock trên trang đăng nhập để kiểm tra nghiệp vụ backend.

Các mã vai trò sử dụng trong ứng dụng:

| Mã vai trò | Ý nghĩa | Quyền truy cập chính |
| --- | --- | --- |
| `SV` | Sinh viên | Hồ sơ và dữ liệu của chính sinh viên |
| `QLKTX` | Quản lý ký túc xá | Nghiệp vụ phòng, sinh viên, đăng ký, hợp đồng và vi phạm |
| `QLTC` | Quản lý tài chính | Hóa đơn, khoản thu, công nợ và thanh toán |
| `ADMIN` | Quản trị viên | Quản trị tài khoản; được cho phép ở một số API quản lý KTX |

## Lệnh build và kiểm tra

Chạy frontend trong thư mục `frontend`:

```powershell
npm run lint
npm run build
```

Chạy backend trong thư mục `backend`:

```powershell
dotnet build
```

Build frontend chạy TypeScript build (`tsc -b`) trước khi tạo bundle Vite. Chưa có hướng dẫn chạy test tự động riêng trong repository; build/lint là các lệnh kiểm tra hiện được khai báo cho frontend.

## Cấu trúc dự án

```text
DBMS330284_02_Final_Project/
├── .gitignore                                      # Các file/thư mục Git bỏ qua
├── backend/                                        # Backend ASP.NET Core Web API
│   ├── Controllers/                                # Các endpoint API theo nhóm chức năng
│   │   ├── Admin/
│   │   │   └── AdminTaiKhoanController.cs          # API quản trị tài khoản
│   │   ├── Chung/
│   │   │   ├── AuthController.cs                   # Đăng nhập và đổi mật khẩu
│   │   │   └── PhongController.cs                  # Tra cứu phòng
│   │   ├── QuanLyKtx/
│   │   │   ├── QuanLyDangKyController.cs           # Duyệt đơn và xếp phòng
│   │   │   ├── QuanLyHopDongController.cs          # Tra cứu/kết thúc hợp đồng
│   │   │   ├── QuanLySinhVienController.cs         # Quản lý hồ sơ sinh viên
│   │   │   └── QuanLyViPhamController.cs           # Quản lý và xử lý vi phạm
│   │   ├── QuanLyTaiChinh/
│   │   │   ├── KhoanThuController.cs               # Quản lý danh mục khoản thu
│   │   │   ├── QuanLyTaiChinhController.cs         # Hóa đơn, công nợ, doanh thu
│   │   │   └── ThuTienController.cs                # Ghi nhận và tra cứu thu tiền
│   │   └── SinhVien/
│   │       └── MeController.cs                     # Hồ sơ và dữ liệu của sinh viên đăng nhập
│   ├── Data/
│   │   ├── Database.cs                             # Khởi tạo và kiểm tra kết nối SQL Server
│   │   └── SqlExtensions.cs                        # Helper tạo lệnh SQL và đọc kết quả
│   ├── Dtos/                                       # Các kiểu dữ liệu request/response
│   │   ├── CaNhanDtos.cs                           # DTO hồ sơ cá nhân
│   │   ├── PhongDTO.cs                             # DTO thông tin phòng
│   │   ├── SinhVienDto.cs                          # DTO nghiệp vụ sinh viên
│   │   ├── TaiChinhDtos.cs                         # DTO hóa đơn và tài chính
│   │   ├── TaiKhoanDto.cs                          # DTO tài khoản và xác thực
│   │   └── ViPhamDtos.cs                           # DTO nghiệp vụ vi phạm
│   ├── Properties/
│   │   └── launchSettings.json                     # Profile chạy local và địa chỉ backend
│   ├── Repositories/                               # Truy vấn và thao tác dữ liệu nghiệp vụ
│   │   ├── DangKyRepository.cs                     # Xử lý đơn đăng ký KTX
│   │   ├── HoaDonRepository.cs                     # Hóa đơn và thanh toán sinh viên
│   │   ├── HopDongRepository.cs                    # Hợp đồng và phân phòng
│   │   ├── PhongRepository.cs                      # Tra cứu phòng và người ở
│   │   ├── SinhVienRepository.cs                   # Tra cứu/thêm/cập nhật sinh viên
│   │   ├── TaiChinhRepository.cs                   # Hóa đơn, công nợ và doanh thu
│   │   ├── TaiKhoanRepository.cs                   # Đăng nhập và quản trị tài khoản
│   │   └── ViPhamRepository.cs                     # Tra cứu và xử lý vi phạm
│   ├── Services/
│   │   └── TokenService.cs                         # Tạo JWT và claims người dùng
│   ├── appsettings.Development.json                # Cấu hình môi trường Development
│   ├── appsettings.json                            # Cấu hình mặc định backend
│   ├── Backend.csproj                              # Target .NET và package backend
│   ├── Program.cs                                  # Khởi tạo ứng dụng, JWT, CORS và phân quyền
│   └── SqlExceptionFilter.cs                       # Xử lý lỗi SQL cho phản hồi API
├── database/                                       # Script database SQL Server
│   ├── QuanLyKTX_Frontend_FULL.sql                 # Tạo database, đối tượng và dữ liệu mẫu
│   └── Role_Login.sql                              # Tạo login/user/role và phân quyền SQL
├── frontend/                                       # Giao diện React + TypeScript
│   ├── public/                                     # Tài nguyên tĩnh phục vụ trực tiếp
│   │   ├── favicon.svg                             # Biểu tượng trang web
│   │   └── icons.svg                               # Bộ biểu tượng SVG
│   ├── src/                                        # Mã nguồn giao diện
│   │   ├── api/                                    # Cấu hình Axios và hàm gọi API
│   │   │   ├── axiosClient.ts                      # Base URL, JWT header và xử lý lỗi API
│   │   │   ├── dormApi.ts                          # Hàm gọi API ký túc xá
│   │   │   └── studentApi.ts                       # Hàm gọi API sinh viên
│   │   ├── assets/                                 # Hình ảnh và SVG dùng trong giao diện
│   │   ├── components/
│   │   │   └── ui/                                 # Thành phần giao diện tái sử dụng
│   │   │       ├── avatar.tsx                      # Avatar
│   │   │       ├── badge.tsx                       # Nhãn trạng thái
│   │   │       ├── button.tsx                      # Nút
│   │   │       ├── card.tsx                        # Thẻ nội dung
│   │   │       ├── dialog.tsx                      # Hộp thoại
│   │   │       ├── dropdown-menu.tsx               # Menu xổ xuống
│   │   │       ├── input.tsx                       # Trường nhập liệu
│   │   │       ├── select.tsx                      # Danh sách lựa chọn
│   │   │       ├── separator.tsx                   # Đường phân cách
│   │   │       ├── sheet.tsx                       # Panel trượt
│   │   │       ├── sonner.tsx                      # Thành phần thông báo
│   │   │       ├── table.tsx                       # Bảng dữ liệu
│   │   │       └── tabs.tsx                        # Các tab
│   │   ├── context/
│   │   │   └── AuthContext.tsx                     # Trạng thái đăng nhập và vai trò
│   │   ├── layouts/
│   │   │   ├── AdminLayout.tsx                     # Khung giao diện quản trị
│   │   │   └── StudentLayout.tsx                   # Khung giao diện sinh viên
│   │   ├── lib/
│   │   │   └── utils.ts                            # Hàm tiện ích dùng chung
│   │   ├── modules/                                # Màn hình theo phân hệ
│   │   │   ├── admin/pages/
│   │   │   │   └── TaiKhoanPage.tsx                # Quản trị tài khoản
│   │   │   ├── dorm/pages/
│   │   │   │   ├── DangKyPage.tsx                  # Duyệt đăng ký/xếp phòng
│   │   │   │   ├── HopDongPage.tsx                 # Quản lý hợp đồng
│   │   │   │   ├── PhongPage.tsx                   # Tra cứu phòng
│   │   │   │   └── SinhVienPage.tsx                # Quản lý sinh viên
│   │   │   ├── finance/pages/
│   │   │   │   ├── HoaDonPage.tsx                  # Hóa đơn
│   │   │   │   ├── KhoanThuPage.tsx                # Danh mục khoản thu
│   │   │   │   └── ThanhToanPage.tsx               # Thanh toán/công nợ
│   │   │   ├── shared/
│   │   │   │   └── ManageUI.tsx                    # Thành phần dùng chung cho màn hình quản lý
│   │   │   ├── student/pages/
│   │   │   │   ├── StudentContractsPage.tsx        # Hợp đồng của sinh viên
│   │   │   │   ├── StudentInvoicesPage.tsx         # Hóa đơn của sinh viên
│   │   │   │   ├── StudentProfilePage.tsx          # Hồ sơ sinh viên
│   │   │   │   ├── StudentRegisterPage.tsx         # Đăng ký ở KTX
│   │   │   │   └── StudentRoomPage.tsx             # Phòng và bạn cùng phòng
│   │   │   └── violation/pages/
│   │   │       └── ViPhamPage.tsx                  # Quản lý vi phạm
│   │   ├── pages/
│   │   │   └── LoginPage.tsx                       # Màn hình đăng nhập
│   │   ├── routes/
│   │   │   ├── ProtectedRoute.tsx                  # Bảo vệ route theo đăng nhập/vai trò
│   │   │   ├── dormRoutes.tsx                      # Route các phân hệ quản trị
│   │   │   └── studentRoutes.tsx                   # Route cổng sinh viên
│   │   ├── types/                                  # Kiểu TypeScript dùng trong ứng dụng
│   │   │   ├── auth.types.ts                       # Kiểu xác thực/tài khoản
│   │   │   ├── dorm.types.ts                       # Kiểu ký túc xá/phòng
│   │   │   └── student.types.ts                    # Kiểu sinh viên
│   │   ├── App.css                                 # CSS riêng cho ứng dụng
│   │   ├── App.tsx                                 # Component gốc và cấu hình router
│   │   ├── index.css                               # CSS toàn cục và Tailwind
│   │   └── main.tsx                                # Điểm khởi chạy React
│   ├── .env.example                                # Ví dụ cấu hình địa chỉ API
│   ├── .gitignore                                  # Các file frontend Git bỏ qua
│   ├── .oxlintrc.json                              # Cấu hình Oxlint
│   ├── README.md                                   # Hướng dẫn riêng cho frontend
│   ├── components.json                             # Cấu hình bộ UI components
│   ├── index.html                                  # HTML host của ứng dụng Vite
│   ├── package-lock.json                           # Khóa phiên bản dependency npm
│   ├── package.json                                # Dependency và lệnh npm
│   ├── postcss.config.js                           # Cấu hình PostCSS
│   ├── tailwind.config.js                          # Cấu hình Tailwind CSS
│   ├── tsconfig.app.json                           # Cấu hình TypeScript cho ứng dụng
│   ├── tsconfig.json                               # Cấu hình TypeScript gốc
│   ├── tsconfig.node.json                          # Cấu hình TypeScript cho công cụ Node
│   └── vite.config.ts                              # Cấu hình Vite, alias và cổng dev
└── README.md                                       # Hướng dẫn tổng quan và chạy dự án
```
