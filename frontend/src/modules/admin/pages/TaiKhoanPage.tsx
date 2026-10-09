import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'

/**
 * Trang Quản trị Tài khoản & Phân quyền.
 * @returns Giao diện của màn hình quản trị tài khoản.
 */
export const TaiKhoanPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản trị Tài khoản & Phân quyền</h2>
        <p className="text-sm text-slate-500">Quản lý danh sách tài khoản người dùng, đổi mật khẩu và cấp quyền</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-900">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Quản trị Tài khoản & Phân quyền</CardTitle>
              <CardDescription>Danh sách tài khoản cán bộ, sinh viên và vai trò hệ thống</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <p>Dữ liệu đang được đồng bộ và cập nhật từ hệ thống.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default TaiKhoanPage
