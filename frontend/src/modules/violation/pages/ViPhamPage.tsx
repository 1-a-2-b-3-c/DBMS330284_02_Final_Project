import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

/**
 * Trang Quản lý Xử lý Vi phạm Kỷ luật.
 * @returns Giao diện của màn hình quản lý vi phạm.
 */
export const ViPhamPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Biên bản Vi phạm Kỷ luật</h2>
        <p className="text-sm text-slate-500">Lập biên bản vi phạm, xử lý kỷ luật và trừ điểm rèn luyện</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Xử lý Vi phạm Kỷ luật</CardTitle>
              <CardDescription>Theo dõi các quyết định xử lý và kỷ luật sinh viên nội trú</CardDescription>
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

export default ViPhamPage
