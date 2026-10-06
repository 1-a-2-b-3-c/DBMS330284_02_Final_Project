USE master
GO

-- Chuyển database về chế độ Single User và ngắt kết nối ngay lập tức (ROLLBACK IMMEDIATE)
ALTER DATABASE QuanLyKTX
SET SINGLE_USER 
WITH ROLLBACK IMMEDIATE;
GO

-- Tiến hành xóa database
DROP DATABASE QuanLyKTX
GO

-- Tạo database mới
CREATE DATABASE QuanLyKTX
GO

USE QuanLyKTX
GO
