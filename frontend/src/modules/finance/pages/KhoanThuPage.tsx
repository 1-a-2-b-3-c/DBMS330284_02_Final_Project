import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { axiosClient } from '@/api/axiosClient'
import { useAuth } from '@/context/AuthContext'
import { Heading, Panel, Table, inputClass, btnClass, secondaryClass, money } from '@/modules/shared/ManageUI'

type KhoanThu = {
  maKhoanThu: number
  tenKhoanThu: string
  donGiaMacDinh: number
  moTa: string | null
  trangThai: boolean
}
type FormKhoanThu = { tenKhoanThu: string; donGiaMacDinh: string; moTa: string; trangThai: boolean }
const emptyForm = (): FormKhoanThu => ({tenKhoanThu: '', donGiaMacDinh: '', moTa: '', trangThai: true})

export default function KhoanThuPage() {
  const { hasRole } = useAuth()
  const [rows, setRows] = useState<KhoanThu[]>([])
  const [create, setCreate] = useState<FormKhoanThu>(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)
  const [edit, setEdit] = useState<FormKhoanThu>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axiosClient.get<KhoanThu[]>('/api/ktx/taichinh/khoan-thu')
      setRows(response.data)
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (hasRole('QLTC')) void load() }, [hasRole, load])

  const valid = (form: FormKhoanThu) => {
    const price = Number(form.donGiaMacDinh)
    if (!form.tenKhoanThu.trim() || form.tenKhoanThu.trim().length > 100 || form.moTa.length > 255 ||
      form.donGiaMacDinh.trim() === '' || !Number.isFinite(price) || price < 0 || price > 999999999999.99) {
      toast.error('Kiểm tra tên khoản thu (tối đa 100 ký tự), mô tả (255 ký tự) và đơn giá hợp lệ.')
      return false
    }
    return true
  }
  const payload = (form: FormKhoanThu) => ({
    tenKhoanThu: form.tenKhoanThu.trim(),
    donGiaMacDinh: Number(form.donGiaMacDinh),
    moTa: form.moTa.trim() || null,
    trangThai: form.trangThai,
  })

  const addFee = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!valid(create)) return
    setSaving(true)
    try {
      await axiosClient.post('/api/ktx/taichinh/khoan-thu', payload(create))
      toast.success('Đã thêm khoản thu vào SQL Server.')
      setCreate(emptyForm())
      await load()
    } catch { /* Axios interceptor đã thông báo lỗi. */ }
    finally { setSaving(false) }
  }

  const startEdit = (fee: KhoanThu) => {
    setEditId(fee.maKhoanThu)
    setEdit({tenKhoanThu: fee.tenKhoanThu, donGiaMacDinh: String(fee.donGiaMacDinh), moTa: fee.moTa ?? '', trangThai: fee.trangThai})
  }
  const saveEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (editId === null || !valid(edit)) return
    setSaving(true)
    try {
      await axiosClient.put(`/api/ktx/taichinh/khoan-thu/${editId}`, payload(edit))
      toast.success('Đã lưu chỉnh sửa vào SQL Server.')
      setEditId(null)
      await load()
    } catch { /* Thông báo lỗi ở axiosClient. */ }
    finally { setSaving(false) }
  }
  const toggle = async (fee: KhoanThu) => {
    setSaving(true)
    try {
      await axiosClient.patch(`/api/ktx/taichinh/khoan-thu/${fee.maKhoanThu}/trang-thai`, {trangThai: !fee.trangThai})
      toast.success(fee.trangThai ? 'Đã ngưng áp dụng khoản thu.' : 'Đã kích hoạt khoản thu.')
      await load()
    } catch { /* Axios interceptor hiển thị lỗi. */ }
    finally { setSaving(false) }
  }

  if (!hasRole('QLTC')) return <p>Bạn cần quyền QLTC để quản lý khoản thu.</p>

  return <div className="space-y-5">
    <Heading title="Danh mục khoản thu" desc="Quản lý khoản phí, đơn giá và trạng thái kích hoạt trong SQL Server" />
    <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
      Dữ liệu lấy trực tiếp từ bảng KhoanThu. Các thay đổi sẽ lưu vào cơ sở dữ liệu và chỉ có tài khoản QLTC được phép thực hiện.
      Đơn giá mới áp dụng cho chi tiết hóa đơn phát sinh sau này, không thay đổi các hóa đơn cũ.
    </p>
    {failed && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Không tải được danh mục từ API. Kiểm tra Backend và thử Tải lại.</p>}

    <Panel title="Thêm khoản thu">
      <form className="grid gap-3 md:grid-cols-4" onSubmit={e => void addFee(e)}>
        <label className="text-sm">Tên khoản thu
          <input required maxLength={100} className={inputClass + ' mt-1'} placeholder="Ví dụ: Phí internet" value={create.tenKhoanThu} onChange={e => setCreate({...create,tenKhoanThu:e.target.value})} />
        </label>
        <label className="text-sm">Đơn giá mặc định (đ)
          <input required type="number" min="0" step="0.01" className={inputClass + ' mt-1'} value={create.donGiaMacDinh} onChange={e => setCreate({...create,donGiaMacDinh:e.target.value})} />
        </label>
        <label className="text-sm">Mô tả (không bắt buộc)
          <input maxLength={255} className={inputClass + ' mt-1'} value={create.moTa} onChange={e => setCreate({...create,moTa:e.target.value})} />
        </label>
        <div className="flex items-end"><button className={btnClass + ' w-full'} disabled={saving}> {saving ? 'Đang lưu...' : '+ Thêm khoản thu'}</button></div>
      </form>
    </Panel>

    <Panel title={`Danh sách khoản thu (${rows.length})${loading ? ' - đang tải...' : ''}`}>
      <div className="mb-3 flex justify-end"><button className={secondaryClass} disabled={loading} onClick={() => void load()}>Tải lại</button></div>
      <Table headers={['Mã', 'Tên khoản thu', 'Đơn giá', 'Mô tả', 'Trạng thái', 'Thao tác']} rows={rows.map(fee => [
        fee.maKhoanThu, fee.tenKhoanThu, money(fee.donGiaMacDinh), fee.moTa ?? '—',
        <span className={fee.trangThai ? 'text-emerald-700' : 'text-slate-500'}>{fee.trangThai ? 'Đang áp dụng' : 'Ngưng áp dụng'}</span>,
        <div className="flex flex-wrap gap-2">
          <button type="button" className={secondaryClass} disabled={saving} onClick={() => startEdit(fee)}>Sửa</button>
          <button type="button" className={secondaryClass} disabled={saving} onClick={() => void toggle(fee)}>{fee.trangThai ? 'Tắt' : 'Bật'}</button>
        </div>,
      ])} />
      {editId !== null && <form className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4" onSubmit={e => void saveEdit(e)}>
        <h4 className="mb-3 font-semibold">Sửa khoản thu #{editId}</h4>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">Tên khoản thu<input required maxLength={100} className={inputClass + ' mt-1'} value={edit.tenKhoanThu} onChange={e => setEdit({...edit, tenKhoanThu:e.target.value})}/></label>
          <label className="text-sm">Đơn giá (đ)<input required type="number" min="0" step="0.01" className={inputClass + ' mt-1'} value={edit.donGiaMacDinh} onChange={e => setEdit({...edit,donGiaMacDinh:e.target.value})}/></label>
          <label className="text-sm">Mô tả<input maxLength={255} className={inputClass + ' mt-1'} value={edit.moTa} onChange={e => setEdit({...edit,moTa:e.target.value})}/></label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.trangThai} onChange={e => setEdit({...edit,trangThai:e.target.checked})} />Đang áp dụng</label>
        <div className="mt-3 flex gap-2"><button className={btnClass} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button><button type="button" className={secondaryClass} onClick={() => setEditId(null)} disabled={saving}>Hủy</button></div>
      </form>}
    </Panel>
  </div>
}
