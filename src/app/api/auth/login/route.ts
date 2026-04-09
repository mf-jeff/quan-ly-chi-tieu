import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { comparePassword, signToken } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !comparePassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

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
