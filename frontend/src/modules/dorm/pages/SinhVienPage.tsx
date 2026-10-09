import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Eye,
  RefreshCw,
  Phone,
  Home,
  GraduationCap,
  KeyRound,
  CheckCircle,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { khopChuoiTimKiem } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  layDanhSachSinhVien,
  layDanhMucSinhVien,
  themSinhVienMoi,
  capNhatSinhVien,
} from '@/api/dormApi'
import type {
  SinhVienDto,
  DanhMucSinhVienDto,
  ThemSinhVienRequest,
  ThemSinhVienResponse,
  CapNhatSinhVienRequest,
} from '@/types/dorm.types'

/**
 * Màn hình Quản lý Hồ sơ Sinh viên KTX (Tasks A-02 & A-03).
 * Cán bộ QLKTX có thể tra cứu, thêm sinh viên mới (tự cấp tài khoản), cập nhật hồ sơ và xem chi tiết.
 * @returns Giao diện quản lý hồ sơ sinh viên.
 */
export const SinhVienPage: React.FC = () => {
  // Trạng thái danh sách sinh viên & danh mục
  const [danhSachSinhVienGoc, setDanhSachSinhVienGoc] = useState<SinhVienDto[]>([])
  const [danhMuc, setDanhMuc] = useState<DanhMucSinhVienDto>({
    gioiTinh: ['Nam', 'Nữ', 'Khác'],
    dienUuTien: ['Con thương binh/liệt sĩ', 'Hộ nghèo', 'Hộ cận nghèo', 'Vùng sâu vùng xa'],
  })
  const [isLoadingSinhVien, setIsLoadingSinhVien] = useState<boolean>(true)

  // Trạng thái bộ lọc tìm kiếm
  const [tuKhoaMaSV, setTuKhoaMaSV] = useState<string>('')
  const [tuKhoaHoTen, setTuKhoaHoTen] = useState<string>('')
  const [khoaLoc, setKhoaLoc] = useState<string>('TAT_CA')
  const [namHocLoc, setNamHocLoc] = useState<string>('TAT_CA')

  // Trạng thái Dialog Xem chi tiết
  const [sinhVienXemChiTiet, setSinhVienXemChiTiet] = useState<SinhVienDto | null>(null)
  const [isMoDialogChiTiet, setIsMoDialogChiTiet] = useState<boolean>(false)

  // Trạng thái Dialog Thêm mới sinh viên
  const [isMoDialogThemMoi, setIsMoDialogThemMoi] = useState<boolean>(false)
  const [isDangXuLyThem, setIsDangXuLyThem] = useState<boolean>(false)
  const [formThemSinhVien, setFormThemSinhVien] = useState<ThemSinhVienRequest>({
    maSV: '',
    hoTen: '',
    ngaySinh: '',
    gioiTinh: 'Nam',
    sdt: '',
    namHoc: 1,
    queQuan: '',
    cccd: '',
    khoa: '',
    dienUuTien: null,
  })

  // Trạng thái Dialog Thông báo cấp tài khoản sau khi thêm thành công
  const [ketQuaCapTaiKhoan, setKetQuaCapTaiKhoan] = useState<ThemSinhVienResponse | null>(null)
  const [isMoDialogCapTaiKhoan, setIsMoDialogCapTaiKhoan] = useState<boolean>(false)

  // Trạng thái Dialog Chỉnh sửa sinh viên
  const [sinhVienDangSua, setSinhVienDangSua] = useState<SinhVienDto | null>(null)
  const [isMoDialogChinhSua, setIsMoDialogChinhSua] = useState<boolean>(false)
  const [isDangXuLySua, setIsDangXuLySua] = useState<boolean>(false)
  const [formSuaSinhVien, setFormSuaSinhVien] = useState<CapNhatSinhVienRequest>({
    sdt: '',
    queQuan: '',
    khoa: '',
    namHoc: 1,
    dienUuTien: null,
  })

  /**
   * Tải danh mục chuẩn và danh sách sinh viên khi khởi động component.
   */
  const khoiTaoDuLieu = async (): Promise<void> => {
    setIsLoadingSinhVien(true)
    try {
      const [ketQuaDanhMuc, ketQuaSinhVien] = await Promise.all([
        layDanhMucSinhVien().catch(() => null),
        layDanhSachSinhVien(),
      ])

      if (ketQuaDanhMuc) {
        setDanhMuc(ketQuaDanhMuc)
      }
      setDanhSachSinhVienGoc(ketQuaSinhVien)
    } catch {
      toast.error('Không thể tải danh sách hồ sơ sinh viên')
    } finally {
      setIsLoadingSinhVien(false)
    }
  }

  useEffect(() => {
    khoiTaoDuLieu()
  }, [])

  /**
   * Tải lại toàn bộ danh sách sinh viên từ Backend API.
   */
  const taiLaiDanhSach = async (): Promise<void> => {
    setIsLoadingSinhVien(true)
    try {
      const ketQua = await layDanhSachSinhVien()
      setDanhSachSinhVienGoc(ketQua)
    } catch {
      toast.error('Lỗi khi tải danh sách sinh viên')
    } finally {
      setIsLoadingSinhVien(false)
    }
  }

  /**
   * Danh sách các khoa độc nhất trích xuất từ toàn bộ dữ liệu gốc (không bị mất khi lọc).
   */
  const danhSachKhoaToanBo = useMemo<string[]>(() => {
    const tapHopKhoa = new Set<string>()
    danhSachSinhVienGoc.forEach((sv) => {
      if (sv.khoa) {
        tapHopKhoa.add(sv.khoa)
      }
    })
    return Array.from(tapHopKhoa).sort()
  }, [danhSachSinhVienGoc])

  /**
   * Lọc tức thì danh sách sinh viên (gõ tới đâu lọc tới đó, hỗ trợ tiếng Việt không dấu / gõ dở).
   */
  const danhSachSinhVienSauLoc = useMemo<SinhVienDto[]>(() => {
    return danhSachSinhVienGoc.filter((sv) => {
      // Khớp mã sinh viên
      if (tuKhoaMaSV.trim() && !khopChuoiTimKiem(sv.maSV, tuKhoaMaSV)) {
        return false
      }
      // Khớp họ tên
      if (tuKhoaHoTen.trim() && !khopChuoiTimKiem(sv.hoTen, tuKhoaHoTen)) {
        return false
      }
      // Khớp khoa
      if (khoaLoc !== 'TAT_CA' && sv.khoa !== khoaLoc) {
        return false
      }
      // Khớp năm học
      if (namHocLoc !== 'TAT_CA' && String(sv.namHoc) !== namHocLoc) {
        return false
      }
      return true
    })
  }, [danhSachSinhVienGoc, tuKhoaMaSV, tuKhoaHoTen, khoaLoc, namHocLoc])

  /**
   * Đặt lại toàn bộ bộ lọc về mặc định.
   */
  const datLaiBoLoc = (): void => {
    setTuKhoaMaSV('')
    setTuKhoaHoTen('')
    setKhoaLoc('TAT_CA')
    setNamHocLoc('TAT_CA')
  }

  /**
   * Mở modal thêm sinh viên và reset lại form.
   */
  const moDialogThemSinhVien = (): void => {
    setFormThemSinhVien({
      maSV: '',
      hoTen: '',
      ngaySinh: '',
      gioiTinh: danhMuc.gioiTinh[0] || 'Nam',
      sdt: '',
      namHoc: 1,
      queQuan: '',
      cccd: '',
      khoa: '',
      dienUuTien: null,
    })
    setIsMoDialogThemMoi(true)
  }

  /**
   * Xử lý gửi biểu mẫu thêm sinh viên mới lên Backend.
   */
  const xuLyThemSinhVien = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    // Kiểm tra tính hợp lệ cơ bản
    if (!formThemSinhVien.maSV.trim()) {
      toast.warning('Vui lòng nhập mã sinh viên')
      return
    }
    if (!formThemSinhVien.hoTen.trim()) {
      toast.warning('Vui lòng nhập họ và tên')
      return
    }
    if (!formThemSinhVien.ngaySinh) {
      toast.warning('Vui lòng chọn ngày sinh')
      return
    }
    if (!formThemSinhVien.sdt.trim()) {
      toast.warning('Vui lòng nhập số điện thoại')
      return
    }
    if (formThemSinhVien.cccd && !/^\d{12}$/.test(formThemSinhVien.cccd.trim())) {
      toast.warning('Số CCCD phải gồm đúng 12 chữ số')
      return
    }

    setIsDangXuLyThem(true)
    try {
      const phanHoiThem = await themSinhVienMoi({
        ...formThemSinhVien,
        maSV: formThemSinhVien.maSV.trim(),
        hoTen: formThemSinhVien.hoTen.trim(),
        sdt: formThemSinhVien.sdt.trim(),
        cccd: formThemSinhVien.cccd?.trim() || undefined,
        queQuan: formThemSinhVien.queQuan?.trim() || undefined,
        khoa: formThemSinhVien.khoa?.trim() || undefined,
        dienUuTien: formThemSinhVien.dienUuTien || null,
      })

      setIsMoDialogThemMoi(false)
      setKetQuaCapTaiKhoan(phanHoiThem)
      setIsMoDialogCapTaiKhoan(true)
      toast.success('Thêm sinh viên thành công!')
      taiLaiDanhSach()
    } catch {
      // Đã có axios interceptor bắt và hiển thị lỗi qua toast
    } finally {
      setIsDangXuLyThem(false)
    }
  }

  /**
   * Mở modal chỉnh sửa và nạp thông tin sinh viên hiện tại vào form.
   * @param sinhVien - Đối tượng sinh viên cần cập nhật.
   */
  const moDialogCapNhatSinhVien = (sinhVien: SinhVienDto): void => {
    setSinhVienDangSua(sinhVien)
    setFormSuaSinhVien({
      sdt: sinhVien.sdt || '',
      queQuan: sinhVien.queQuan || '',
      khoa: sinhVien.khoa || '',
      namHoc: sinhVien.namHoc || 1,
      dienUuTien: sinhVien.dienUuTien || null,
    })
    setIsMoDialogChinhSua(true)
  }

  /**
   * Xử lý gửi biểu mẫu cập nhật thông tin sinh viên lên Backend.
   */
  const xuLyCapNhatSinhVien = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!sinhVienDangSua) return

    setIsDangXuLySua(true)
    try {
      await capNhatSinhVien(sinhVienDangSua.maSV, {
        sdt: formSuaSinhVien.sdt?.trim(),
        queQuan: formSuaSinhVien.queQuan?.trim(),
        khoa: formSuaSinhVien.khoa?.trim(),
        namHoc: formSuaSinhVien.namHoc,
        dienUuTien: formSuaSinhVien.dienUuTien || null,
      })

      setIsMoDialogChinhSua(false)
      toast.success('Cập nhật thông tin sinh viên thành công!')
      taiLaiDanhSach()
    } catch {
      // Toast hiển thị từ interceptor
    } finally {
      setIsDangXuLySua(false)
    }
  }

  /**
   * Mở dialog xem thông tin chi tiết sinh viên.
   * @param sinhVien - Đối tượng sinh viên được chọn.
   */
  const moDialogXemChiTiet = (sinhVien: SinhVienDto): void => {
    setSinhVienXemChiTiet(sinhVien)
    setIsMoDialogChiTiet(true)
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & Nút thêm mới */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý Hồ sơ Sinh viên
          </h2>
          <p className="text-sm text-slate-500">
            Danh sách sinh viên nội trú, diện chính sách ưu tiên và quản lý thông tin cư trú
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={taiLaiDanhSach}
            disabled={isLoadingSinhVien}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingSinhVien ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </Button>
          <Button
            size="sm"
            onClick={moDialogThemSinhVien}
            className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800"
          >
            <UserPlus className="h-4 w-4" />
            <span>Thêm sinh viên mới</span>
          </Button>
        </div>
      </div>

      {/* Thẻ Lọc & Tìm kiếm */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Tìm kiếm theo Mã SV */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Mã sinh viên</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Ví dụ: SV001..."
                  value={tuKhoaMaSV}
                  onChange={(e) => setTuKhoaMaSV(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>

            {/* Tìm kiếm theo Họ tên */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Họ và tên</label>
              <Input
                placeholder="Nhập tên sinh viên..."
                value={tuKhoaHoTen}
                onChange={(e) => setTuKhoaHoTen(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Lọc theo Khoa */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Khoa / Viện</label>
              <select
                value={khoaLoc}
                onChange={(e) => setKhoaLoc(e.target.value)}
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="TAT_CA">Tất cả các khoa</option>
                {danhSachKhoaToanBo.map((khoa) => (
                  <option key={khoa} value={khoa}>
                    {khoa}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Năm học */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Năm học</label>
              <select
                value={namHocLoc}
                onChange={(e) => setNamHocLoc(e.target.value)}
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="TAT_CA">Tất cả năm học</option>
                <option value="1">Năm 1</option>
                <option value="2">Năm 2</option>
                <option value="3">Năm 3</option>
                <option value="4">Năm 4</option>
                <option value="5">Năm 5</option>
              </select>
            </div>

            {/* Nút đặt lại bộ lọc */}
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={datLaiBoLoc}
                className="h-8 w-full text-xs text-slate-600 hover:text-slate-900"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Đặt lại lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bảng danh sách sinh viên */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 py-3.5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900">
              Danh sách Sinh viên ({danhSachSinhVienSauLoc.length} / {danhSachSinhVienGoc.length} hồ sơ)
            </CardTitle>
          </div>
        </CardHeader>

        {isLoadingSinhVien ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              <p className="text-sm">Đang tải hồ sơ sinh viên...</p>
            </div>
          </div>
        ) : danhSachSinhVienSauLoc.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <Users className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">Không tìm thấy sinh viên nào</p>
            <p className="text-xs text-slate-400 mt-1">
              Thử thay đổi từ khóa hoặc nhấn Đặt lại lọc để xem toàn bộ danh sách
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75">
                  <TableHead className="w-28">Mã SV</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Khoa / Ngành</TableHead>
                  <TableHead className="text-center">Năm</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Diện ưu tiên</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSachSinhVienSauLoc.map((sv) => (
                  <TableRow key={sv.maSV} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-slate-900">{sv.maSV}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{sv.hoTen}</p>
                        <p className="text-xs text-slate-400">Sinh ngày: {sv.ngaySinh}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {sv.gioiTinh}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{sv.khoa || '—'}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                        {sv.namHoc}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">{sv.sdt}</TableCell>
                    <TableCell>
                      {sv.dienUuTien ? (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-normal"
                        >
                          {sv.dienUuTien}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Không có</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moDialogXemChiTiet(sv)}
                          title="Xem chi tiết"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moDialogCapNhatSinhVien(sv)}
                          title="Chỉnh sửa thông tin"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Modal 1: Xem chi tiết Hồ sơ Sinh viên */}
      <Dialog open={isMoDialogChiTiet} onOpenChange={setIsMoDialogChiTiet}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hồ sơ Sinh viên</DialogTitle>
            <DialogDescription>
              Thông tin nhân khẩu và lưu trú của sinh viên trong hệ thống
            </DialogDescription>
          </DialogHeader>

          {sinhVienXemChiTiet && (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg bg-slate-50 p-4 space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Mã số sinh viên:</span>
                  <span className="font-bold text-slate-900">{sinhVienXemChiTiet.maSV}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Họ và tên:</span>
                  <span className="font-semibold text-slate-900">{sinhVienXemChiTiet.hoTen}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Ngày sinh:</span>
                  <span className="text-slate-800">{sinhVienXemChiTiet.ngaySinh}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Giới tính:</span>
                  <span className="text-slate-800">{sinhVienXemChiTiet.gioiTinh}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Số CCCD / Định danh:</span>
                  <span className="font-mono text-slate-800">
                    {sinhVienXemChiTiet.cccd || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Số điện thoại:</span>
                  <span className="text-slate-800">{sinhVienXemChiTiet.sdt}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Khoa / Viện:</span>
                  <span className="text-slate-800">{sinhVienXemChiTiet.khoa || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Năm học:</span>
                  <span className="text-slate-800">Năm thứ {sinhVienXemChiTiet.namHoc}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Quê quán:</span>
                  <span className="text-slate-800">{sinhVienXemChiTiet.queQuan || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Diện ưu tiên:</span>
                  <span>
                    {sinhVienXemChiTiet.dienUuTien ? (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        {sinhVienXemChiTiet.dienUuTien}
                      </Badge>
                    ) : (
                      'Không có'
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMoDialogChiTiet(false)}
              className="w-full sm:w-auto"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Thêm mới Sinh viên */}
      <Dialog open={isMoDialogThemMoi} onOpenChange={setIsMoDialogThemMoi}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm mới Sinh viên KTX</DialogTitle>
            <DialogDescription>
              Nhập thông tin sinh viên để lưu trữ và tự động khởi tạo tài khoản truy cập
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={xuLyThemSinhVien} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Mã sinh viên <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="VD: SV2026001"
                  value={formThemSinhVien.maSV}
                  onChange={(e) =>
                    setFormThemSinhVien({ ...formThemSinhVien, maSV: e.target.value })
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="VD: Nguyễn Văn A"
                  value={formThemSinhVien.hoTen}
                  onChange={(e) =>
                    setFormThemSinhVien({ ...formThemSinhVien, hoTen: e.target.value })
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Ngày sinh <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  required
                  value={formThemSinhVien.ngaySinh}
                  onChange={(e) =>
                    setFormThemSinhVien({ ...formThemSinhVien, ngaySinh: e.target.value })
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Giới tính <span className="text-red-500">*</span>
                </label>
                <select
                  value={formThemSinhVien.gioiTinh}
                  onChange={(e) =>
                    setFormThemSinhVien({ ...formThemSinhVien, gioiTinh: e.target.value })
                  }
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none mt-1"
                >
                  {danhMuc.gioiTinh.map((gt) => (
                    <option key={gt} value={gt}>
                      {gt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="0912345678"
                  value={formThemSinhVien.sdt}
                  onChange={(e) =>
                    setFormThemSinhVien({ ...formThemSinhVien, sdt: e.target.value })
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">CCCD (12 chữ số)</label>
                <Input
                  placeholder="001200001234"
                  maxLength={12}
                  value={formThemSinhVien.cccd}
                  onChange={(e) =>
                    setFormThemSinhVien({ ...formThemSinhVien, cccd: e.target.value })
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Khoa / Viện đào tạo</label>
                <Input
                  placeholder="Công nghệ Thông tin"
                  value={formThemSinhVien.khoa}
                  onChange={(e) =>
                    setFormThemSinhVien({ ...formThemSinhVien, khoa: e.target.value })
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Năm học (1 - 6)</label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={formThemSinhVien.namHoc}
                  onChange={(e) =>
                    setFormThemSinhVien({
                      ...formThemSinhVien,
                      namHoc: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Quê quán</label>
              <Input
                placeholder="Tỉnh/Thành phố quê quán"
                value={formThemSinhVien.queQuan}
                onChange={(e) =>
                  setFormThemSinhVien({ ...formThemSinhVien, queQuan: e.target.value })
                }
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Diện ưu tiên chính sách</label>
              <select
                value={formThemSinhVien.dienUuTien || ''}
                onChange={(e) =>
                  setFormThemSinhVien({
                    ...formThemSinhVien,
                    dienUuTien: e.target.value === '' ? null : e.target.value,
                  })
                }
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none mt-1"
              >
                <option value="">Không thuộc diện ưu tiên</option>
                {danhMuc.dienUuTien.map((duTien) => (
                  <option key={duTien} value={duTien}>
                    {duTien}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMoDialogThemMoi(false)}
                disabled={isDangXuLyThem}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isDangXuLyThem}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {isDangXuLyThem ? 'Đang tạo...' : 'Xác nhận tạo hồ sơ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Thông báo Cấp Tài khoản Mặc định */}
      <Dialog open={isMoDialogCapTaiKhoan} onOpenChange={setIsMoDialogCapTaiKhoan}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              <DialogTitle>Tạo Sinh viên & Tài khoản thành công</DialogTitle>
            </div>
            <DialogDescription>
              Hệ thống đã tự động cấp tài khoản đăng nhập cho sinh viên với thông tin mặc định:
            </DialogDescription>
          </DialogHeader>

          {ketQuaCapTaiKhoan && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Tên đăng nhập:</span>
                <span className="font-mono font-bold text-slate-900">
                  {ketQuaCapTaiKhoan.tenDangNhap}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Mật khẩu ban đầu:</span>
                <span className="font-mono font-bold text-slate-900">
                  {ketQuaCapTaiKhoan.matKhauBanDau}
                </span>
              </div>
              <p className="pt-2 text-[11px] text-slate-500 italic">
                * Nhắc sinh viên đổi mật khẩu ngay sau lần đầu tiên đăng nhập vào Cổng Sinh viên.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setIsMoDialogCapTaiKhoan(false)}
              className="w-full bg-slate-900 text-white"
            >
              Đã hiểu & Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Chỉnh sửa Sinh viên */}
      <Dialog open={isMoDialogChinhSua} onOpenChange={setIsMoDialogChinhSua}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật Hồ sơ Sinh viên</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin liên hệ và chính sách ưu tiên của SV {sinhVienDangSua?.maSV}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={xuLyCapNhatSinhVien} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-slate-700">Số điện thoại</label>
              <Input
                value={formSuaSinhVien.sdt || ''}
                onChange={(e) =>
                  setFormSuaSinhVien({ ...formSuaSinhVien, sdt: e.target.value })
                }
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Quê quán</label>
              <Input
                value={formSuaSinhVien.queQuan || ''}
                onChange={(e) =>
                  setFormSuaSinhVien({ ...formSuaSinhVien, queQuan: e.target.value })
                }
                className="h-8 text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Khoa / Viện</label>
                <Input
                  value={formSuaSinhVien.khoa || ''}
                  onChange={(e) =>
                    setFormSuaSinhVien({ ...formSuaSinhVien, khoa: e.target.value })
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Năm học</label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={formSuaSinhVien.namHoc || 1}
                  onChange={(e) =>
                    setFormSuaSinhVien({
                      ...formSuaSinhVien,
                      namHoc: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Diện ưu tiên</label>
              <select
                value={formSuaSinhVien.dienUuTien || ''}
                onChange={(e) =>
                  setFormSuaSinhVien({
                    ...formSuaSinhVien,
                    dienUuTien: e.target.value === '' ? null : e.target.value,
                  })
                }
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none mt-1"
              >
                <option value="">Không thuộc diện ưu tiên</option>
                {danhMuc.dienUuTien.map((duTien) => (
                  <option key={duTien} value={duTien}>
                    {duTien}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMoDialogChinhSua(false)}
                disabled={isDangXuLySua}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isDangXuLySua}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {isDangXuLySua ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SinhVienPage
