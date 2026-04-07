import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--pt-font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CPAC Project Tracking",
  description: "ระบบติดตามสถานะคำสั่งจองและโครงการ CPAC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${ibmPlexSansThai.variable}`}>
      <body className="min-h-screen font-sans antialiased bg-pt-neutral-50 text-pt-neutral-900">
        <Navbar />
        <main className="w-full">{children}</main>
      </body>
    </html>
  );
}