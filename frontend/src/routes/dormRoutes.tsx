import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { type RouteObject, Navigate } from 'react-router-dom'
import PhongPage from '@/modules/dorm/pages/PhongPage'
import SinhVienPage from '@/modules/dorm/pages/SinhVienPage'
import DangKyPage from '@/modules/dorm/pages/DangKyPage'
import HopDongPage from '@/modules/dorm/pages/HopDongPage'
import HoaDonPage from '@/modules/finance/pages/HoaDonPage'
import ViPhamPage from '@/modules/violation/pages/ViPhamPage'
import TaiKhoanPage from '@/modules/admin/pages/TaiKhoanPage'
import KhoanThuPage from '@/modules/finance/pages/KhoanThuPage'
import ThanhToanPage from '@/modules/finance/pages/ThanhToanPage'

const AdminIndex: React.FC = () => {
  const { nguoiDung } = useAuth()
  return <Navigate to={nguoiDung?.maVaiTro === 'QLTC' ? '/admin/tai-chinh' : nguoiDung?.maVaiTro === 'ADMIN' ? '/admin/tai-khoan' : '/admin/phong'} replace />
}

/**
 * Danh sách định tuyến các màn hình thuộc quyền quản lý của Cán bộ QLKTX và Quản trị viên.
 * Bao gồm các module Lưu trú, Tài chính, Kỷ luật và Quản trị hệ thống.
 */
export const dormRoutes: RouteObject[] = [
  {
    index: true,
    element: <AdminIndex />,
  },
  {
    path: 'phong',
    element: <PhongPage />,
  },
  {
    path: 'sinh-vien',
    element: <SinhVienPage />,
  },
  {
    path: 'dang-ky',
    element: <DangKyPage />,
  },
  {
    path: 'hop-dong',
    element: <HopDongPage />,
  },
  // Phân hệ Tài chính, Kỷ luật và Quản trị
  {
    path: 'tai-chinh',
    element: <HoaDonPage />,
  },
  { path: 'khoan-thu', element: <KhoanThuPage /> },
  { path: 'thanh-toan', element: <ThanhToanPage /> },
  {
    path: 'vi-pham',
    element: <ViPhamPage />,
  },
  {
    path: 'tai-khoan',
    element: <TaiKhoanPage />,
  },
]
