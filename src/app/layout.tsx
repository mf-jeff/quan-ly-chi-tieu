import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/components/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vault - Quản lý chi tiêu",
  description: "Ứng dụng quản lý chi tiêu cá nhân thông minh",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  themeColor: "#0b1120",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex bg-background text-foreground">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              className: "rounded-xl",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
