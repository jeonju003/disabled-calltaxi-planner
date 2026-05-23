import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "장애인 콜택시 일정 도우미",
  description:
    "서울시 장애인콜시스템·일별 이용현황 공공데이터로 이용 패턴과 약속 일정을 돕습니다.",
  applicationName: "콜택시 일정",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "콜택시 일정",
  },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#7DD3FC",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={notoSans.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className={`${notoSans.className} min-h-screen antialiased`}>
        <div className="app-shell">
          <PwaRegister />
          {children}
          <InstallPrompt />
        </div>
      </body>
    </html>
  );
}
