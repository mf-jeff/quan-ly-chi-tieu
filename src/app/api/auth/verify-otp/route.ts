import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { hashPassword, signToken } from "@/lib/server/auth";
import { seedDefaultCategories } from "@/lib/server/seed-categories";
import { otpStore } from "../send-otp/route";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email và mã xác thực là bắt buộc" }, { status: 400 });
    }

    const stored = otpStore.get(email);
    if (!stored) {
      return NextResponse.json({ error: "Mã xác thực không tồn tại. Vui lòng yêu cầu mã mới." }, { status: 400 });
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return NextResponse.json({ error: "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới." }, { status: 400 });
    }

    if (stored.code !== code.trim()) {
      return NextResponse.json({ error: "Mã xác thực không đúng" }, { status: 400 });
    }

    // OTP valid — create user
    otpStore.delete(email);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: stored.name,
        passwordHash: hashPassword(stored.password),
      },
    });

    await seedDefaultCategories(user.id);

    const token = await signToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
