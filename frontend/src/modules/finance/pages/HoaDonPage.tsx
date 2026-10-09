import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Receipt } from 'lucide-react'

/**
 * Trang Quản lý Hóa đơn & Thu phí KTX.
 * @returns Giao diện của màn hình quản lý hóa đơn.
 */
export const HoaDonPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Hóa đơn & Thu phí KTX</h2>
        <p className="text-sm text-slate-500">Phân hệ Quản lý Tài chính, hóa đơn tiền phòng và các dịch vụ nội trú</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Quản lý Hóa đơn & Thu phí</CardTitle>
              <CardDescription>Theo dõi danh sách hóa đơn, phiếu thu và trạng thái thanh toán</CardDescription>
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

export default HoaDonPage
