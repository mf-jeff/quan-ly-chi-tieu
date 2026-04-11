import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { jwtSecret } from "@/lib/server/auth";
import { SignJWT } from "jose";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service chưa cấu hình" }, { status: 500 });
    }
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email là bắt buộc" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({ success: true, message: "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu" });
    }

    // Create reset token (valid 1 hour)
    const resetToken = await new SignJWT({ userId: user.id, type: "reset" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .setIssuedAt()
      .sign(jwtSecret);

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "https://vaultmoneymanager.vercel.app";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send email
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Vault <onboarding@resend.dev>",
      to: email,
      subject: "Đặt lại mật khẩu - Vault",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e3a8a;">🔐 Vault - Đặt lại mật khẩu</h2>
          <p>Xin chào <strong>${user.name}</strong>,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Click nút bên dưới để tạo mật khẩu mới:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Đặt lại mật khẩu
          </a>
          <p style="color: #94a3b8; font-size: 14px;">Link có hiệu lực trong 1 giờ.</p>
          <p style="color: #94a3b8; font-size: 12px;">Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Đã gửi email đặt lại mật khẩu" });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
