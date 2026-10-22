import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { axiosClient } from '@/api/axiosClient'
import { layDanhSachPhong } from '@/api/dormApi'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Heading, Panel, Table, inputClass, btnClass, secondaryClass, money, val, today } from '@/modules/shared/ManageUI'
import type { PhongDto } from '@/types/dorm.types'

type Row = Record<string, unknown>
type LoaiDoiTuongLapHoaDon = 'sinhVien' | 'phong'
type InvoiceLoadResult = { rows: Row[]; overdue: Row[]; errors: string[] }

export default function HoaDonPage() {
  const { hasRole } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [overdue, setOverdue] = useState<Row[]>([])
  const [rooms, setRooms] = useState<PhongDto[]>([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<{ hoaDon: Row; chiTiet: Row[] } | null>(null)
  const [form, setForm] = useState({
    doiTuong: 'sinhVien' as LoaiDoiTuongLapHoaDon,
    maSV: '',
    maPhong: '',
    loaiHoaDon: 'Tiền phòng',
    hanThanhToan: today(),
    maKhoanThu: '',
    soLuong: '1',
  })
  const [detail, setDetail] = useState({ maKhoanThu: '', soLuong: '1', donGia: '', mienGiam: '0' })
  const [loading, setLoading] = useState(false)
  const [loadErrors, setLoadErrors] = useState<string[]>([])

  const fetchInvoices = useCallback(async (maSV: string): Promise<InvoiceLoadResult> => {
    const [congNoResult, quaHanResult] = await Promise.allSettled([
      axiosClient.get<Row[]>('/api/ktx/taichinh/cong-no', { params: { maSV: maSV || undefined } }),
      axiosClient.get<Row[]>('/api/ktx/taichinh/hoa-don-qua-han'),
    ])
    const errors: string[] = []
    const invoiceRows =
      congNoResult.status === 'fulfilled' && Array.isArray(congNoResult.value.data) ? congNoResult.value.data : []
    const overdueRows =
      quaHanResult.status === 'fulfilled' && Array.isArray(quaHanResult.value.data) ? quaHanResult.value.data : []

    if (congNoResult.status !== 'fulfilled' || !Array.isArray(congNoResult.value.data))
      errors.push('danh sách công nợ')
    if (quaHanResult.status !== 'fulfilled' || !Array.isArray(quaHanResult.value.data))
      errors.push('hóa đơn quá hạn')

    return { rows: invoiceRows, overdue: overdueRows, errors }
  }, [])

  const applyInvoices = useCallback((data: InvoiceLoadResult) => {
    setRows(data.rows)
    setOverdue(data.overdue)
    setLoadErrors(data.errors)
  }, [])

  const refresh = async (maSV: string) => {
    setLoading(true)
    try {
      applyInvoices(await fetchInvoices(maSV))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasRole('QLTC')) return

    void fetchInvoices('').then(applyInvoices)
    void layDanhSachPhong()
      .then(phong => setRooms(phong.filter(item => item.soNguoiDangO > 0)))
      .catch(() => toast.error('Không tải được danh sách phòng đang có sinh viên.'))
  }, [applyInvoices, fetchInvoices, hasRole])

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn()
      toast.success('Thao tác thành công')
      await refresh(filter)
    } catch {
      // Axios interceptor displays API errors.
    }
  }

  const view = async (id: number) => {
    try {
      const response = await axiosClient.get<{ hoaDon: Row; chiTiet: Row[] }>(`/api/ktx/taichinh/hoa-don/${id}`)
      setSelected(response.data)
    } catch {
      // Axios interceptor displays API errors.
    }
  }

  const submitInvoice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const room = rooms.find(item => String(item.maPhong) === form.maPhong)
    if (form.doiTuong === 'phong' && !room) {
      toast.error('Vui lòng chọn phòng đang có sinh viên.')
      return
    }

    try {
      const response = await axiosClient.post<{ soLuongHoaDon: number }>('/api/ktx/taichinh/hoa-don', {
        maSV: form.doiTuong === 'sinhVien' ? form.maSV.trim() : null,
        tenPhong: form.doiTuong === 'phong' ? room?.soPhong : null,
        tenKhu: form.doiTuong === 'phong' ? room?.tenKhu : null,
        loaiHoaDon: form.loaiHoaDon,
        hanThanhToan: form.hanThanhToan,
        maKhoanThu: Number(form.maKhoanThu),
        soLuong: Number(form.soLuong),
      })
      toast.success(`Đã lập ${response.data.soLuongHoaDon} hóa đơn.`)
      await refresh(filter)
    } catch {
      // Axios interceptor displays API errors.
    }
  }

  if (!hasRole('QLTC')) return <p>Bạn cần quyền QLTC để quản lý hóa đơn.</p>

  return (
    <div className="space-y-5">
      <Heading title="Hóa đơn & công nợ" desc="Lập hóa đơn, xem chi tiết, hủy hóa đơn và theo dõi nợ quá hạn" />
      {loadErrors.length > 0 && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Không tải được API {loadErrors.join(' và ')}. Dữ liệu của API còn lại vẫn được giữ nguyên. Hãy kiểm tra lỗi
          trong Network (F12) hoặc Terminal Backend.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Số hóa đơn', loadErrors.includes('danh sách công nợ') ? '—' : rows.length],
          ['Hóa đơn quá hạn', loadErrors.includes('hóa đơn quá hạn') ? '—' : overdue.length],
          [
            'Tổng số tiền còn nợ',
            loadErrors.includes('danh sách công nợ')
              ? '—'
              : money(rows.reduce((sum, row) => sum + Number(row.ConNo ?? row.conNo ?? row.SoTienConLai ?? row.soTienConLai ?? 0), 0)),
          ],
        ].map(([label, value]) => (
          <div className="rounded-xl border bg-white p-5" key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <Panel title="Lập hóa đơn">
        <form className="grid gap-3 md:grid-cols-3" onSubmit={submitInvoice}>
          <select
            required
            aria-label="Đối tượng lập hóa đơn"
            className={inputClass}
            value={form.doiTuong}
            onChange={event => setForm({ ...form, doiTuong: event.target.value as LoaiDoiTuongLapHoaDon })}
          >
            <option value="sinhVien">Theo mã sinh viên</option>
            <option value="phong">Theo tên phòng (tất cả sinh viên trong phòng)</option>
          </select>
          {form.doiTuong === 'sinhVien' ? (
            <input
              required
              maxLength={15}
              className={inputClass}
              placeholder="Mã sinh viên"
              aria-label="Mã sinh viên lập hóa đơn"
              value={form.maSV}
              onChange={event => setForm({ ...form, maSV: event.target.value })}
            />
          ) : (
            <select
              required
              className={inputClass}
              aria-label="Phòng cần lập hóa đơn"
              value={form.maPhong}
              onChange={event => setForm({ ...form, maPhong: event.target.value })}
              disabled={rooms.length === 0}
            >
              <option value="">Chọn phòng</option>
              {rooms.map(room => (
                <option key={room.maPhong} value={room.maPhong}>
                  Phòng {room.soPhong} - {room.tenKhu} ({room.soNguoiDangO} sinh viên)
                </option>
              ))}
            </select>
          )}
          <input
            required
            className={inputClass}
            placeholder="Loại hóa đơn"
            value={form.loaiHoaDon}
            onChange={event => setForm({ ...form, loaiHoaDon: event.target.value })}
          />
          <input
            required
            aria-label="Hạn thanh toán"
            type="date"
            className={inputClass}
            value={form.hanThanhToan}
            onChange={event => setForm({ ...form, hanThanhToan: event.target.value })}
          />
          <input
            required
            type="number"
            min="1"
            className={inputClass}
            placeholder="Mã khoản thu"
            value={form.maKhoanThu}
            onChange={event => setForm({ ...form, maKhoanThu: event.target.value })}
          />
          <input
            required
            type="number"
            min="1"
            className={inputClass}
            placeholder="Số lượng"
            value={form.soLuong}
            onChange={event => setForm({ ...form, soLuong: event.target.value })}
          />
          <button className={btnClass}>Lập hóa đơn</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Hóa đơn theo phòng được lập cho tất cả sinh viên đang ở phòng đã chọn. Phòng được hiển thị kèm tên khu để
          phân biệt các phòng trùng số. Mã khoản thu phải tồn tại trong CSDL.
        </p>
      </Panel>

      <Panel title={'Danh sách hóa đơn' + (loading ? ' (đang tải...)' : '')}>
        <div className="mb-4 flex gap-2">
          <input
            className={inputClass + ' max-w-xs'}
            placeholder="Mã sinh viên"
            aria-label="Tìm mã sinh viên"
            value={filter}
            onChange={event => setFilter(event.target.value)}
          />
          <button className={secondaryClass} onClick={() => void refresh(filter)}>
            Tìm
          </button>
        </div>
        <Table
          headers={['Mã hóa đơn', 'Mã SV', 'Ngày lập', 'Hạn nộp', 'Loại', 'Trạng thái', 'Thao tác']}
          rows={rows.map(row => {
            const id = Number(row.MaHoaDon ?? row.maHoaDon)
            return [
              val(row, 'MaHoaDon', 'maHoaDon'),
              val(row, 'MaSV', 'maSV'),
              val(row, 'NgayLap', 'ngayLap'),
              val(row, 'HanThanhToan', 'hanThanhToan'),
              val(row, 'LoaiHoaDon', 'loaiHoaDon'),
              val(row, 'TrangThai', 'trangThai'),
              <div className="flex gap-2" key={`invoice-actions-${id}`}>
                <button className={secondaryClass} onClick={() => void view(id)}>
                  Chi tiết
                </button>
                <button
                  className={secondaryClass}
                  onClick={() => {
                    if (window.confirm(`Hủy hóa đơn ${id}?`))
                      void run(() => axiosClient.patch(`/api/ktx/taichinh/hoa-don/${id}/huy`))
                  }}
                >
                  Hủy
                </button>
              </div>,
            ]
          })}
        />
      </Panel>

      {selected && (
        <Panel title={'Chi tiết hóa đơn #' + val(selected.hoaDon, 'MaHoaDon', 'maHoaDon')}>
          <Table
            headers={['Khoản thu', 'Số lượng', 'Đơn giá', 'Miễn giảm', 'Thành tiền']}
            rows={selected.chiTiet.map(row => [
              val(row, 'TenKhoanThu', 'tenKhoanThu'),
              val(row, 'SoLuong', 'soLuong'),
              money(row.DonGia ?? row.donGia),
              money(row.MienGiam ?? row.mienGiam),
              money(row.ThanhTien ?? row.thanhTien),
            ])}
          />
          <form
            className="mt-4 grid gap-2 md:grid-cols-5"
            onSubmit={event => {
              event.preventDefault()
              const id = Number(selected.hoaDon.MaHoaDon ?? selected.hoaDon.maHoaDon)
              void run(async () => {
                await axiosClient.post(`/api/ktx/taichinh/hoa-don/${id}/chi-tiet`, {
                  maKhoanThu: Number(detail.maKhoanThu),
                  soLuong: Number(detail.soLuong),
                  donGia: detail.donGia ? Number(detail.donGia) : null,
                  mienGiam: detail.mienGiam ? Number(detail.mienGiam) : 0,
                })
                await view(id)
              })
            }}
          >
            <input
              className={inputClass}
              required
              type="number"
              min="1"
              placeholder="Mã khoản thu"
              value={detail.maKhoanThu}
              onChange={event => setDetail({ ...detail, maKhoanThu: event.target.value })}
            />
            <input
              className={inputClass}
              required
              type="number"
              min="1"
              placeholder="SL"
              value={detail.soLuong}
              onChange={event => setDetail({ ...detail, soLuong: event.target.value })}
            />
            <input
              className={inputClass}
              type="number"
              min="0"
              placeholder="Đơn giá (tùy chọn)"
              value={detail.donGia}
              onChange={event => setDetail({ ...detail, donGia: event.target.value })}
            />
            <input
              className={inputClass}
              type="number"
              min="0"
              placeholder="Miễn giảm"
              value={detail.mienGiam}
              onChange={event => setDetail({ ...detail, mienGiam: event.target.value })}
            />
            <button className={btnClass}>Thêm chi tiết</button>
          </form>
          <button className={secondaryClass + ' mt-3'} onClick={() => setSelected(null)}>
            Đóng
          </button>
        </Panel>
      )}
    </div>
  )
}
