import { IBM_Plex_Sans_Thai } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

// ตั้งค่าฟอนต์ตามที่ทีมต้องการ
const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--pt-font-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${ibmPlexSansThai.variable}`}>
      <body className="min-h-screen bg-background antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}