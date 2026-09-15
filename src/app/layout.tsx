import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة سماوة",
  description: "أساس آمن لإدارة العملاء والتشغيل.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar-SA" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
