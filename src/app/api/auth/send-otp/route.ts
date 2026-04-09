import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { Resend } from "resend";

// Store OTP in memory (simple approach for serverless — valid for ~5min)
const otpStore = new Map<string, { code: string; expires: number; name: string; password: string; inviteCode: string }>();

export { otpStore };

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service chưa cấu hình" }, { status: 500 });
    }

    const { email, name, password, inviteCode } = await req.json();

    // Validate invite code
    const validCode = process.env.INVITE_CODE || "VAULT2026";
    if (!inviteCode || inviteCode.trim().toUpperCase() !== validCode.toUpperCase()) {
      return NextResponse.json({ error: "Mã mời không hợp lệ" }, { status: 403 });
    }

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
    }

    // Check if email already exists
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP with registration data
    otpStore.set(email, { code, expires, name, password, inviteCode });

    // Send OTP email
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Vault <onboarding@resend.dev>",
      to: email,
      subject: "Mã xác thực - Vault",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e3a8a;">🔐 Vault - Xác thực email</h2>
          <p>Xin chào <strong>${name}</strong>,</p>
          <p>Mã xác thực của bạn là:</p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e3a8a;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">Mã có hiệu lực trong 5 phút.</p>
          <p style="color: #94a3b8; font-size: 12px;">Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Đã gửi mã xác thực" });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
