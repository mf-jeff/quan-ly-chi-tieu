import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const data = [
    { "Ngày": "01/04/2026", "Người chi": "Đức", "Danh mục": "Đi chợ", "Ghi chú": "Thịt 70 + rau 17 + thịt bò 40", "Số tiền": 127 },
    { "Ngày": "01/04/2026", "Người chi": "Đức", "Danh mục": "Y tế", "Ghi chú": "Tiêm 6 in 1 (mũi số 2)", "Số tiền": 1098 },
    { "Ngày": "02/04/2026", "Người chi": "Hồng", "Danh mục": "Nhà cửa", "Ghi chú": "Thanh Toán Tiền Điện", "Số tiền": 779 },
    { "Ngày": "03/04/2026", "Người chi": "Đức", "Danh mục": "Đi chợ", "Ghi chú": "Bánh mì 22 + cá 45 + rau 18", "Số tiền": 95 },
    { "Ngày": "04/04/2026", "Người chi": "Hồng", "Danh mục": "Mua sắm", "Ghi chú": "Quần áo 100 + nước giặt 342", "Số tiền": 442 },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws["!cols"] = [
    { wch: 12 }, // Ngày
    { wch: 12 }, // Người chi
    { wch: 15 }, // Danh mục
    { wch: 40 }, // Ghi chú
    { wch: 12 }, // Số tiền
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Mẫu nhập liệu");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=mau-nhap-giao-dich.xlsx",
    },
  });
}
