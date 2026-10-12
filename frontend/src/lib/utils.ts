import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Gộp các class CSS với Tailwind và giải quyết các xung đột class một cách thông minh.
 * @param danhSachClass - Danh sách các giá trị class (chuỗi, mảng, object điều kiện).
 * @returns Chuỗi class CSS hoàn chỉnh đã được hợp nhất và xử lý trùng lặp.
 */
export function cn(...danhSachClass: ClassValue[]): string {
  return twMerge(clsx(danhSachClass))
}

/**
 * Chuẩn hóa chuỗi bằng cách loại bỏ dấu tiếng Việt và chuyển sang chữ thường.
 * Phục vụ tìm kiếm tức thì linh hoạt (tìm kiếm không dấu, gõ Telex dở).
 * @param chuoi - Chuỗi ký tự tiếng Việt cần chuẩn hóa.
 * @returns Chuỗi ký tự không dấu ở dạng chữ thường.
 */
export function loaiBoDauTiengViet(chuoi: string | null | undefined): string {
  if (!chuoi) return ''
  return chuoi
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/**
 * Kiểm tra xem chuỗi nguồn có chứa từ khóa tìm kiếm hay không.
 * Hỗ trợ khớp chính xác có dấu HOẶC khớp không dấu (cho phép gõ 'hoan' vẫn khớp với 'Hoàng').
 * @param chuoiNguon - Chuỗi văn bản cần tìm (ví dụ: họ tên, số phòng, mã SV).
 * @param tuKhoa - Từ khóa do người dùng nhập vào ô tìm kiếm.
 * @returns True nếu chuỗi nguồn thỏa mãn từ khóa tìm kiếm.
 */
export function khopChuoiTimKiem(
  chuoiNguon: string | null | undefined,
  tuKhoa: string | null | undefined
): boolean {
  if (!tuKhoa || !tuKhoa.trim()) return true
  if (!chuoiNguon) return false

  const tuKhoaThuong = tuKhoa.toLowerCase().trim()
  const nguonThuong = chuoiNguon.toLowerCase()
  if (nguonThuong.includes(tuKhoaThuong)) return true

  const tuKhoaKhongDau = loaiBoDauTiengViet(tuKhoa)
  const nguonKhongDau = loaiBoDauTiengViet(chuoiNguon)
  return nguonKhongDau.includes(tuKhoaKhongDau)
}
