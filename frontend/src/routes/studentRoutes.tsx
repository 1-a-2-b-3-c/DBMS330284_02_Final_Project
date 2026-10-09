import React from 'react'
import { type RouteObject, Navigate } from 'react-router-dom'
import StudentProfilePage from '@/modules/student/pages/StudentProfilePage'
import StudentRoomPage from '@/modules/student/pages/StudentRoomPage'
import StudentRegisterPage from '@/modules/student/pages/StudentRegisterPage'
import StudentContractsPage from '@/modules/student/pages/StudentContractsPage'
import StudentInvoicesPage from '@/modules/student/pages/StudentInvoicesPage'

/**
 * Danh sách định tuyến các màn hình thuộc Cổng Dịch vụ Sinh viên (Role SV).
 */
export const studentRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="/student/profile" replace />,
  },
  {
    path: 'profile',
    element: <StudentProfilePage />,
  },
  {
    path: 'my-room',
    element: <StudentRoomPage />,
  },
  {
    path: 'register-dorm',
    element: <StudentRegisterPage />,
  },
  {
    path: 'contracts',
    element: <StudentContractsPage />,
  },
  {
    path: 'invoices',
    element: <StudentInvoicesPage />,
  },
]
