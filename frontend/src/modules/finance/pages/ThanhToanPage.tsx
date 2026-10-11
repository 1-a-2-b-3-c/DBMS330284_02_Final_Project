import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { axiosClient } from '@/api/axiosClient'
import { useAuth } from '@/context/AuthContext'
import { Heading, Panel, Table, inputClass, secondaryClass, btnClass, money, val } from '@/modules/shared/ManageUI'

type Row = Record<string, unknown>
type PhuongThuc = 'Tiền mặt' | 'Chuyển khoản'
const field = (r: Row, k: string) => r[k] ?? r[k[0].toUpperCase() + k.slice(1)]
const currencyNumber = (r: Row) => Number(field(r, 'conNo') ?? field(r, 'soTienConLai') ?? 0)

export default function ThanhToanPage() {
  const {hasRole} = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [filter, setFilter] = useState('')
  const [overdue, setOverdue] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState<Row | null>(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PhuongThuc>('Tiền mặt')
  const [transactionId, setTransactionId] = useState('')
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<Row[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const endpoint = overdue ? 'hoa-don-qua-han' : 'cong-no'
      const response = await axiosClient.get<Row[]>(`/api/ktx/taichinh/${endpoint}`, {params: {maSV: filter.trim() || undefined}})
      setRows(response.data)
      setFailed(false)
    } catch { setFailed(true) }
    finally { setLoading(false) }
  }, [filter, overdue])

  useEffect(() => { if (hasRole('QLTC')) void load() }, [overdue, hasRole])

  const choose = async (invoice: Row) => {
    setSelected(invoice)
    setMethod('Tiền mặt')
    setAmount(String(currencyNumber(invoice)))
    setTransactionId('')
    setHistory([])
    try {
      const response = await axiosClient.get<Row[]>(`/api/ktx/taichinh/thu-tien/lich-su/${field(invoice,'maHoaDon')}`)
      setHistory(response.data)
    } catch { /* Axios hiển thị lỗi; có thể vẫn ghi nhận sau khi kiểm tra. */ }
  }

  const pay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selected) return
    const amountNum = Number(amount)
    const remaining = currencyNumber(selected)
    if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > remaining) {
      toast.error('Số tiền phải lớn hơn 0 và không vượt quá số còn nợ.')
      return
    }
    if (method === 'Chuyển khoản' && !transactionId.trim()) {
      toast.error('Nhập mã giao dịch chuyển khoản.')
      return
    }
    const invoiceId = Number(field(selected, 'maHoaDon'))
    if (!window.confirm(`Xác nhận ĐÃ NHẬN ${money(amountNum)} bằng ${method} cho hóa đơn #${invoiceId}? Dữ liệu sẽ ghi vào SQL Server.`)) return
    setSaving(true)
    try {
      const response = await axiosClient.post<{maThanhToan:number}>('/api/ktx/taichinh/thu-tien', {
        maHoaDon: invoiceId,
        soTien: amountNum,
        phuongThuc: method,
        maGiaoDich: method === 'Chuyển khoản' ? transactionId.trim() : null,
      })
      toast.success(`Đã ghi nhận thanh toán #${response.data.maThanhToan}.`)
      setSelected(null)
      setHistory([])
      await load()
    } catch { /* Không hiển thị thành công nếu Backend trả lỗi. */ }
    finally { setSaving(false) }
  }

  const exportCsv = () => {
    const headers = ['Mã hóa đơn','Mã SV','Hạn thanh toán','Trạng thái','Công nợ']
    const data = [headers, ...rows.map(r => [field(r,'maHoaDon'),field(r,'maSV'),field(r,'hanThanhToan'),field(r,'trangThai'),currencyNumber(r)])]
    const csv = '\uFEFF' + data.map(row => row.map(c => '"' + String(c ?? '').replaceAll('"','""') + '"').join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}))
    const a = document.createElement('a')
    a.href = url
    a.download = 'bao-cao-cong-no.csv'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (!hasRole('QLTC')) return <p>Bạn cần quyền QLTC để ghi nhận thanh toán.</p>

  return <div className="space-y-5">
    <Heading title="Thanh toán & báo cáo công nợ" desc="Tra cứu công nợ và ghi nhận tiền thu vào SQL Server" />
    <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
      Ghi nhận thủ công tiền mặt hoặc khoản chuyển khoản <strong>đã thực sự nhận</strong>. Hệ thống không kết nối ngân hàng để xác minh giao dịch. Mỗi lần xác nhận sẽ tạo chứng từ ThanhToan trong SQL Server.
    </p>
    {failed && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Không tải được công nợ từ API. Kiểm tra Backend rồi Tải lại.</p>}

    <Panel title="Tra cứu công nợ">
      <form onSubmit={e => {e.preventDefault();void load()}} className="flex flex-wrap items-center gap-2">
        <input className={inputClass+' max-w-xs'} placeholder="Mã sinh viên" aria-label="Mã sinh viên" value={filter} onChange={e => setFilter(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={overdue} onChange={e => setOverdue(e.target.checked)} /> Chỉ quá hạn</label>
        <button className={secondaryClass} disabled={loading}>Tra cứu</button>
        <button type="button" className={secondaryClass} disabled={loading} onClick={exportCsv}>Xuất CSV</button>
      </form>
    </Panel>

    <Panel title={`Danh sách công nợ (${rows.length})${loading ? ' - đang tải...' : ''}`}>
      <Table headers={['Hóa đơn','Sinh viên','Hạn thanh toán','Trạng thái','Còn nợ','Thao tác']} rows={rows.map(r => [
        val(r,'maHoaDon','MaHoaDon'),val(r,'maSV','MaSV'),val(r,'hanThanhToan','HanThanhToan'),
        val(r,'trangThai','TrangThai'),money(currencyNumber(r)),
        <button type="button" className={secondaryClass} onClick={() => void choose(r)} disabled={saving || currencyNumber(r) <= 0 || String(field(r,'trangThai')) === 'Đã hủy'}>
          Ghi nhận thu
        </button>,
      ])} />
    </Panel>

    {selected && <Panel title={`Ghi nhận tiền thu - Hóa đơn #${field(selected,'maHoaDon')}`}>
      <p className="mb-3 text-sm">Sinh viên: <strong>{val(selected,'maSV','MaSV')}</strong> · Công nợ hiện tại: <strong>{money(currencyNumber(selected))}</strong></p>
      <form className="grid gap-3 md:grid-cols-3" onSubmit={e => void pay(e)}>
        <label className="text-sm">Số tiền thực nhận (đ)
          <input required className={inputClass+' mt-1'} type="number" min="0.01" step="0.01" max={currencyNumber(selected)} value={amount} onChange={e => setAmount(e.target.value)} />
        </label>
        <label className="text-sm">Phương thức
          <select className={inputClass+' mt-1'} value={method} onChange={e => setMethod(e.target.value as PhuongThuc)}><option>Tiền mặt</option><option>Chuyển khoản</option></select>
        </label>
        <label className="text-sm">Mã giao dịch {method === 'Chuyển khoản' ? '(bắt buộc)' : '(không dùng)'}
          <input className={inputClass+' mt-1'} maxLength={100} value={transactionId} disabled={method === 'Tiền mặt'} required={method === 'Chuyển khoản'} placeholder="Mã từ ngân hàng" onChange={e => setTransactionId(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2 md:col-span-3">
          <button className={btnClass} disabled={saving}>{saving ? 'Đang ghi nhận...' : 'Xác nhận đã thu tiền'}</button>
          <button type="button" className={secondaryClass} disabled={saving} onClick={() => setSelected(null)}>Đóng</button>
        </div>
      </form>
      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold">Lịch sử giao dịch hóa đơn</h4>
        <Table headers={['Mã giao dịch hệ thống','Ngày','Số tiền','Phương thức','Trạng thái','Mã ngân hàng']} rows={history.map(item => [
          val(item,'maThanhToan','MaThanhToan'),val(item,'ngayThanhToan','NgayThanhToan'),money(field(item,'soTien')),
          val(item,'phuongThuc','PhuongThuc'),val(item,'trangThai','TrangThai'),val(item,'maGiaoDich','MaGiaoDich'),
        ])} />
      </div>
    </Panel>}
  </div>
}
