import React from 'react'
import { type RouteObject, Navigate } from 'react-router-dom'
import PhongPage from '@/modules/dorm/pages/PhongPage'
import SinhVienPage from '@/modules/dorm/pages/SinhVienPage'
import DangKyPage from '@/modules/dorm/pages/DangKyPage'
import HopDongPage from '@/modules/dorm/pages/HopDongPage'
import HoaDonPage from '@/modules/finance/pages/HoaDonPage'
import ViPhamPage from '@/modules/violation/pages/ViPhamPage'
import TaiKhoanPage from '@/modules/admin/pages/TaiKhoanPage'

/**
 * Danh sách định tuyến các màn hình thuộc quyền quản lý của Cán bộ QLKTX và Quản trị viên.
 * Bao gồm các module Lưu trú, Tài chính, Kỷ luật và Quản trị hệ thống.
 */
export const dormRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="/admin/phong" replace />,
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
  {
    path: 'vi-pham',
    element: <ViPhamPage />,
  },
  {
    path: 'tai-khoan',
    element: <TaiKhoanPage />,
  },
]
