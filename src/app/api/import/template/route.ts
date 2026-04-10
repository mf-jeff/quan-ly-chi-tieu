import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const data = [
    { "Ngày": "09/04/2026", "Người": "Đức", "Danh mục": "Ăn uống", "Ghi chú": "Cơm trưa văn phòng", "Số tiền": 85000, "Thanh toán": "Tiền mặt", "Loại": "Chi tiêu" },
    { "Ngày": "09/04/2026", "Người": "Đức", "Danh mục": "Di chuyển", "Ghi chú": "Grab đi làm", "Số tiền": 45000, "Thanh toán": "Chuyển khoản", "Loại": "Chi tiêu" },
    { "Ngày": "05/04/2026", "Người": "Đức", "Danh mục": "Lương", "Ghi chú": "Lương tháng 4", "Số tiền": 25000000, "Thanh toán": "Chuyển khoản", "Loại": "Thu nhập" },
    { "Ngày": "08/04/2026", "Người": "Hồng", "Danh mục": "Mua sắm", "Ghi chú": "Áo thun Uniqlo", "Số tiền": 350000, "Thanh toán": "Thẻ", "Loại": "Chi tiêu" },
    { "Ngày": "07/04/2026", "Người": "Hồng", "Danh mục": "Hóa đơn", "Ghi chú": "Tiền điện tháng 3", "Số tiền": 1500000, "Thanh toán": "Chuyển khoản", "Loại": "Chi tiêu" },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = [
    { wch: 12 },  // A: Ngày
    { wch: 10 },  // B: Người
    { wch: 15 },  // C: Danh mục
    { wch: 35 },  // D: Ghi chú
    { wch: 15 },  // E: Số tiền
    { wch: 14 },  // F: Thanh toán
    { wch: 12 },  // G: Loại
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Mẫu nhập giao dịch");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=mau-nhap-giao-dich.xlsx",
    },
  });
}
