import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest, hashPassword, comparePassword } from "@/lib/server/auth";

export async function PUT(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, currentPassword, newPassword } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Change password
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Vui lòng nhập mật khẩu hiện tại" }, { status: 400 });
    }
    if (!comparePassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Mật khẩu mới tối thiểu 6 ký tự" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash: hashPassword(newPassword) },
    });
    return NextResponse.json({ success: true, message: "Đã đổi mật khẩu" });
  }

  // Update name/email
  const updateData: Record<string, string> = {};
  if (name && name.trim()) updateData.name = name.trim();
  if (email && email.trim() && email !== user.email) {
    const exists = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (exists) return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    updateData.email = email.trim();
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Không có gì thay đổi" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: payload.userId },
    data: updateData,
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ success: true, user: updated });
}
