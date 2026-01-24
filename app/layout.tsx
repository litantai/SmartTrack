import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import DatabaseStatusIndicator from "@/components/DatabaseStatusIndicator";

export const metadata: Metadata = {
  title: "SmartTrack 智能试车场综合管理系统",
  description: "让试车场管理更智能、更高效、更安全。一站式数字化解决方案，连接人、车、场地与数据。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <DatabaseStatusIndicator />
        </AuthProvider>
      </body>
    </html>
  );
}
