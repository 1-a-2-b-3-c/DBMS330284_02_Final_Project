import {useEffect,useState} from 'react'
import {axiosClient} from '@/api/axiosClient'
import {useAuth} from '@/context/AuthContext'
import {toast} from 'sonner'
import {Heading,Panel,Table,inputClass,btnClass,secondaryClass,money,val,today} from '@/modules/shared/ManageUI'
type Row=Record<string,unknown>
export default function HoaDonPage(){const {hasRole}=useAuth();const [rows,setRows]=useState<Row[]>([]);const [overdue,setOverdue]=useState<Row[]>([]);const [filter,setFilter]=useState('');const [selected,setSelected]=useState<{hoaDon:Row,chiTiet:Row[]}|null>(null);const [form,setForm]=useState({maPhanPhong:'',loaiHoaDon:'Tiền phòng',hanThanhToan:today(),maKhoanThu:'',soLuong:'1'});const [detail,setDetail]=useState({maKhoanThu:'',soLuong:'1',donGia:'',mienGiam:'0'});const [loading,setLoading]=useState(false);const [loadErrors,setLoadErrors]=useState<string[]>([])
 const load=async()=>{
  setLoading(true)
  try {
   // Mỗi API được xử lý riêng: API quá hạn lỗi không được xóa danh sách công nợ.
   const [congNoResult,quaHanResult]=await Promise.allSettled([
    axiosClient.get<Row[]>('/api/ktx/taichinh/cong-no',{params:{maSV:filter||undefined}}),
    axiosClient.get<Row[]>('/api/ktx/taichinh/hoa-don-qua-han')
   ])
   const errors:string[]=[]
   if(congNoResult.status==='fulfilled' && Array.isArray(congNoResult.value.data)){
    setRows(congNoResult.value.data)
   } else {
    setRows([])
    errors.push('danh sách công nợ')
   }
   if(quaHanResult.status==='fulfilled' && Array.isArray(quaHanResult.value.data)){
    setOverdue(quaHanResult.value.data)
   } else {
    setOverdue([])
    errors.push('hóa đơn quá hạn')
   }
   setLoadErrors(errors)
  } finally {setLoading(false)}
 };
 useEffect(()=>{if(hasRole('QLTC'))void load()},[]);
 const run=async(fn:()=>Promise<unknown>)=>{try{await fn();toast.success('Thao tác thành công');await load()}catch{/* interceptor */}}
 const view=async(id:number)=>{try{const r=await axiosClient.get<{hoaDon:Row,chiTiet:Row[]}>(`/api/ktx/taichinh/hoa-don/${id}`);setSelected(r.data)}catch{/* interceptor */}}
 if(!hasRole('QLTC'))return <p>Bạn cần quyền QLTC để quản lý hóa đơn.</p>
 return <div className="space-y-5"><Heading title="Hóa đơn & công nợ" desc="Lập hóa đơn, xem chi tiết, hủy hóa đơn và theo dõi nợ quá hạn"/>{loadErrors.length>0&&<div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Không tải được API {loadErrors.join(' và ')}. Dữ liệu của API còn lại vẫn được giữ nguyên. Hãy kiểm tra lỗi trong Network (F12) hoặc Terminal Backend.</div>}<div className="grid gap-4 sm:grid-cols-3">{[['Số hóa đơn',loadErrors.includes('danh sách công nợ')?'—':rows.length],['Hóa đơn quá hạn',loadErrors.includes('hóa đơn quá hạn')?'—':overdue.length],['Tổng số tiền còn nợ',loadErrors.includes('danh sách công nợ')?'—':money(rows.reduce((s,r)=>s+Number(r.ConNo??r.conNo??r.SoTienConLai??r.soTienConLai??0),0))]].map(([label,num])=><div className="rounded-xl border bg-white p-5" key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{num}</p></div>)}</div>
 <Panel title="Lập hóa đơn"><form className="grid gap-3 md:grid-cols-3" onSubmit={e=>{e.preventDefault();void run(()=>axiosClient.post('/api/ktx/taichinh/hoa-don',{maPhanPhong:Number(form.maPhanPhong),loaiHoaDon:form.loaiHoaDon,hanThanhToan:form.hanThanhToan,maKhoanThu:Number(form.maKhoanThu),soLuong:Number(form.soLuong)}))}}><input required min="1" type="number" className={inputClass} placeholder="Mã phân phòng" value={form.maPhanPhong} onChange={e=>setForm({...form,maPhanPhong:e.target.value})}/><input required className={inputClass} placeholder="Loại hóa đơn" value={form.loaiHoaDon} onChange={e=>setForm({...form,loaiHoaDon:e.target.value})}/><input required aria-label="Hạn thanh toán" type="date" className={inputClass} value={form.hanThanhToan} onChange={e=>setForm({...form,hanThanhToan:e.target.value})}/><input required type="number" min="1" className={inputClass} placeholder="Mã khoản thu" value={form.maKhoanThu} onChange={e=>setForm({...form,maKhoanThu:e.target.value})}/><input required type="number" min="1" className={inputClass} placeholder="Số lượng" value={form.soLuong} onChange={e=>setForm({...form,soLuong:e.target.value})}/><button className={btnClass}>Lập hóa đơn</button></form><p className="mt-2 text-xs text-slate-500">Mã phân phòng và mã khoản thu phải tồn tại trong CSDL. Phần danh mục khoản thu đang ở chế độ mẫu vì thiếu API.</p></Panel>
 <Panel title={'Danh sách hóa đơn'+(loading?' (đang tải...)':'')}><div className="mb-4 flex gap-2"><input className={inputClass+' max-w-xs'} placeholder="Mã sinh viên" aria-label="Tìm mã sinh viên" value={filter} onChange={e=>setFilter(e.target.value)}/><button className={secondaryClass} onClick={()=>void load()}>Tìm</button></div><Table headers={['Mã hóa đơn','Mã SV','Ngày lập','Hạn nộp','Loại','Trạng thái','Thao tác']} rows={rows.map(r=>{const id=Number(r.MaHoaDon??r.maHoaDon);return [val(r,'MaHoaDon','maHoaDon'),val(r,'MaSV','maSV'),val(r,'NgayLap','ngayLap'),val(r,'HanThanhToan','hanThanhToan'),val(r,'LoaiHoaDon','loaiHoaDon'),val(r,'TrangThai','trangThai'),<div className="flex gap-2"><button className={secondaryClass} onClick={()=>void view(id)}>Chi tiết</button><button className={secondaryClass} onClick={()=>{if(window.confirm(`Hủy hóa đơn ${id}?`))void run(()=>axiosClient.patch(`/api/ktx/taichinh/hoa-don/${id}/huy`))}}>Hủy</button></div>]})}/></Panel>
 {selected&&<Panel title={'Chi tiết hóa đơn #'+val(selected.hoaDon,'MaHoaDon','maHoaDon')}><Table headers={['Khoản thu','Số lượng','Đơn giá','Miễn giảm','Thành tiền']} rows={selected.chiTiet.map(r=>[val(r,'TenKhoanThu','tenKhoanThu'),val(r,'SoLuong','soLuong'),money(r.DonGia??r.donGia),money(r.MienGiam??r.mienGiam),money(r.ThanhTien??r.thanhTien)])}/><form className="mt-4 grid gap-2 md:grid-cols-5" onSubmit={e=>{e.preventDefault();const id=Number(selected.hoaDon.MaHoaDon??selected.hoaDon.maHoaDon);void run(async()=>{await axiosClient.post(`/api/ktx/taichinh/hoa-don/${id}/chi-tiet`,{maKhoanThu:Number(detail.maKhoanThu),soLuong:Number(detail.soLuong),donGia:detail.donGia?Number(detail.donGia):null,mienGiam:detail.mienGiam?Number(detail.mienGiam):0});await view(id)})}}><input className={inputClass} required type="number" min="1" placeholder="Mã khoản thu" value={detail.maKhoanThu} onChange={e=>setDetail({...detail,maKhoanThu:e.target.value})}/><input className={inputClass} required type="number" min="1" placeholder="SL" value={detail.soLuong} onChange={e=>setDetail({...detail,soLuong:e.target.value})}/><input className={inputClass} type="number" min="0" placeholder="Đơn giá (tùy chọn)" value={detail.donGia} onChange={e=>setDetail({...detail,donGia:e.target.value})}/><input className={inputClass} type="number" min="0" placeholder="Miễn giảm" value={detail.mienGiam} onChange={e=>setDetail({...detail,mienGiam:e.target.value})}/><button className={btnClass}>Thêm chi tiết</button></form><button className={secondaryClass+' mt-3'} onClick={()=>setSelected(null)}>Đóng</button></Panel>}</div>
}
