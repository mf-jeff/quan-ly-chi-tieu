import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const data = [
    { "Loại": "Chi tiêu", "Số tiền": 85000, "Danh mục": "Ăn uống", "Ghi chú": "Cơm trưa văn phòng", "Người": "Đức", "Thanh toán": "Tiền mặt", "Ngày": "09/04/2026" },
    { "Loại": "Chi tiêu", "Số tiền": 45000, "Danh mục": "Di chuyển", "Ghi chú": "Grab đi làm", "Người": "Đức", "Thanh toán": "Chuyển khoản", "Ngày": "09/04/2026" },
    { "Loại": "Thu nhập", "Số tiền": 25000000, "Danh mục": "Lương", "Ghi chú": "Lương tháng 4", "Người": "Đức", "Thanh toán": "Chuyển khoản", "Ngày": "05/04/2026" },
    { "Loại": "Chi tiêu", "Số tiền": 350000, "Danh mục": "Mua sắm", "Ghi chú": "Áo thun Uniqlo", "Người": "Hồng", "Thanh toán": "Thẻ", "Ngày": "08/04/2026" },
    { "Loại": "Chi tiêu", "Số tiền": 1500000, "Danh mục": "Hóa đơn", "Ghi chú": "Tiền điện tháng 3", "Người": "Hồng", "Thanh toán": "Chuyển khoản", "Ngày": "07/04/2026" },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = [
    { wch: 12 },  // Loại
    { wch: 15 },  // Số tiền
    { wch: 15 },  // Danh mục
    { wch: 35 },  // Ghi chú
    { wch: 10 },  // Người
    { wch: 14 },  // Thanh toán
    { wch: 12 },  // Ngày
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
