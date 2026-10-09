import React, { useState, useEffect } from 'react'
import {
  FileCheck,
  FileText,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { layHopDongCuaToi, layDanhSachViPhamCuaToi } from '@/api/studentApi'
import type { HopDongDto } from '@/types/dorm.types'
import type { ViPhamSinhVienDto } from '@/types/student.types'

/**
 * Màn hình Tra cứu Hợp đồng Lưu trú & Lịch sử Kỷ luật Sinh viên (Task A-10).
 * Cho phép sinh viên theo dõi thời hạn hợp đồng ở KTX và các biên bản nhắc nhở/xử lý kỷ luật của bản thân.
 * @returns Giao diện tra cứu hợp đồng và kỷ luật.
 */
export const StudentContractsPage: React.FC = () => {
  // Trạng thái dữ liệu
  const [danhSachHopDong, setDanhSachHopDong] = useState<HopDongDto[]>([])
  const [danhSachViPham, setDanhSachViPham] = useState<ViPhamSinhVienDto[]>([])
  const [isLoadingDuLieu, setIsLoadingDuLieu] = useState<boolean>(true)

  /**
   * Tải danh sách hợp đồng và biên bản vi phạm từ Backend API.
   */
  const taiDuLieu = async (): Promise<void> => {
    setIsLoadingDuLieu(true)
    try {
      const [dsHopDong, dsViPham] = await Promise.all([
        layHopDongCuaToi(),
        layDanhSachViPhamCuaToi(),
      ])
      setDanhSachHopDong(dsHopDong)
      setDanhSachViPham(dsViPham)
    } catch {
      toast.error('Không thể tải thông tin hợp đồng và kỷ luật')
    } finally {
      setIsLoadingDuLieu(false)
    }
  }

  useEffect(() => {
    taiDuLieu()
  }, [])

  /**
   * Hiển thị thời hạn hợp đồng còn lại.
   * @param hopDong - Đối tượng hợp đồng cần kiểm tra.
   */
  const renderThoiHanConLai = (hopDong: HopDongDto) => {
    if (hopDong.trangThai !== 'Có hiệu lực' && hopDong.trangThai !== 'CO_HIEU_LUC') {
      return <Badge variant="secondary">Đã thanh lý</Badge>
    }

    const soNgay = hopDong.soNgayConLai
    if (typeof soNgay !== 'number') {
      return <span className="text-xs text-slate-500">Vô thời hạn</span>
    }

    if (soNgay < 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          Quá hạn {Math.abs(soNgay)} ngày
        </Badge>
      )
    }

    if (soNgay <= 30) {
      return (
        <Badge
          variant="secondary"
          className="border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold"
        >
          <AlertTriangle className="mr-1 h-3 w-3 text-amber-600" />
          Còn {soNgay} ngày
        </Badge>
      )
    }

    return (
      <Badge
        variant="outline"
        className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold"
      >
        <Clock className="mr-1 h-3 w-3 text-emerald-600" />
        Còn {soNgay} ngày
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & Nút tải lại */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Hợp đồng & Biên bản Kỷ luật
          </h2>
          <p className="text-sm text-slate-500">
            Kiểm tra thời hạn lưu trú hợp pháp và lịch sử chấp hành nội quy ký túc xá
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={taiDuLieu}
            disabled={isLoadingDuLieu}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingDuLieu ? 'animate-spin' : ''}`} />
            <span>Làm mới dữ liệu</span>
          </Button>
        </div>
      </div>

      {isLoadingDuLieu ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm">Đang tải dữ liệu cá nhân...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="hop-dong" className="space-y-4">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="hop-dong" className="text-xs sm:text-sm gap-2">
              <FileCheck className="h-4 w-4" />
              <span>Hợp đồng Lưu trú ({danhSachHopDong.length})</span>
            </TabsTrigger>
            <TabsTrigger value="vi-pham" className="text-xs sm:text-sm gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Biên bản Kỷ luật ({danhSachViPham.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Danh sách Hợp đồng Lưu trú */}
          <TabsContent value="hop-dong" className="space-y-4">
            {danhSachHopDong.length === 0 ? (
              <Card className="border-dashed border-slate-300">
                <CardContent className="flex h-48 flex-col items-center justify-center text-center p-6">
                  <FileText className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Bạn chưa có hợp đồng lưu trú nào
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Hợp đồng sẽ tự động được tạo sau khi đơn đăng ký của bạn được Ban quản lý phê duyệt và phân phòng
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {danhSachHopDong.map((hd) => {
                  const isHieuLuc =
                    hd.trangThai === 'Có hiệu lực' || hd.trangThai === 'CO_HIEU_LUC'

                  return (
                    <Card
                      key={hd.maHopDong}
                      className={`border-slate-200 shadow-sm transition-all ${
                        isHieuLuc ? 'border-l-4 border-l-slate-900' : 'opacity-85'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-slate-900">
                                Hợp đồng #{hd.maHopDong}
                              </span>
                              <Badge
                                variant={isHieuLuc ? 'default' : 'secondary'}
                                className={isHieuLuc ? 'bg-emerald-600' : ''}
                              >
                                {hd.trangThai}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Mã phân phòng: #{hd.maPhanPhong}
                            </p>
                          </div>

                          <div>{renderThoiHanConLai(hd)}</div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                          <div>
                            <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                              <Building className="h-3.5 w-3.5 text-slate-400" />
                              Phòng cư trú:
                            </span>
                            <p className="font-semibold text-slate-900 text-sm">
                              Phòng {hd.soPhong} - {hd.tenKhu}
                            </p>
                          </div>

                          <div>
                            <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              Ngày bắt đầu:
                            </span>
                            <p className="font-medium text-slate-900">{hd.ngayBatDau}</p>
                          </div>

                          <div>
                            <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              Ngày kết thúc:
                            </span>
                            <p className="font-medium text-slate-900">
                              {hd.ngayKetThuc || 'Theo thời gian đào tạo'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700 block mb-1">
                            Điều khoản cam kết:
                          </span>
                          <p className="text-slate-600 rounded bg-white p-2.5 border border-slate-200">
                            {hd.dieuKhoan ||
                              'Sinh viên cam kết tuân thủ quy chế nội trú của KTX, giữ gìn vệ sinh và nộp lệ phí đầy đủ.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Danh sách Biên bản Kỷ luật */}
          <TabsContent value="vi-pham" className="space-y-4">
            {danhSachViPham.length === 0 ? (
              <Card className="border-dashed border-emerald-200 bg-emerald-50/40">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-900">
                    Bạn không có biên bản vi phạm kỷ luật nào
                  </h3>
                  <p className="mt-1 text-xs text-emerald-700 max-w-sm">
                    Hãy tiếp tục chấp hành tốt nội quy ký túc xá để tích lũy điểm rèn luyện xuất sắc!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 py-3.5 px-6">
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    <span>Danh sách Biên bản Vi phạm Kỷ luật ({danhSachViPham.length})</span>
                  </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/75">
                        <TableHead className="w-20">Mã BB</TableHead>
                        <TableHead>Ngày vi phạm</TableHead>
                        <TableHead>Nội dung vi phạm</TableHead>
                        <TableHead>Địa điểm</TableHead>
                        <TableHead>Hình thức xử lý</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {danhSachViPham.map((vp) => (
                        <TableRow key={vp.maViPham} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono text-xs font-semibold text-slate-900">
                            #{vp.maViPham}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {vp.ngayViPham}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-900">
                            {vp.noiDung}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {vp.diaDiem || 'Tại phòng'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-800 border-amber-200 text-xs"
                            >
                              {vp.hinhThucXuLy}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                vp.trangThaiXuLy === 'Đã giải quyết' ? 'outline' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {vp.trangThaiXuLy}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default StudentContractsPage
