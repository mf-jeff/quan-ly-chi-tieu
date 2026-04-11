import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { hashPassword, jwtSecret } from "@/lib/server/auth";
import { jwtVerify } from "jose";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token và mật khẩu là bắt buộc" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
    }

    // Verify token
    let payload;
    try {
      const result = await jwtVerify(token, jwtSecret);
      payload = result.payload as { userId: string; type: string };
    } catch {
      return NextResponse.json({ error: "Link đã hết hạn hoặc không hợp lệ" }, { status: 400 });
    }

    if (payload.type !== "reset") {
      return NextResponse.json({ error: "Token không hợp lệ" }, { status: 400 });
    }

    // Update password
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash: hashPassword(password) },
    });

    return NextResponse.json({ success: true, message: "Đã đặt lại mật khẩu thành công" });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
