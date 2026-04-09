import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { hashPassword, signToken } from "@/lib/server/auth";
import { seedDefaultCategories } from "@/lib/server/seed-categories";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, inviteCode } = await req.json();

    // Invite code required — only owner can share this code
    const validCode = process.env.INVITE_CODE || "VAULT2026";
    if (!inviteCode || inviteCode.trim().toUpperCase() !== validCode.toUpperCase()) {
      return NextResponse.json(
        { error: "Mã mời không hợp lệ" },
        { status: 403 }
      );
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, mật khẩu và tên là bắt buộc" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu tối thiểu 6 ký tự" },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Email đã được sử dụng" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
      },
    });

    await seedDefaultCategories(user.id);

    const token = await signToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi server" },
      { status: 500 }
    );
  }
}
