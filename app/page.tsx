// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }
"use client"; // ต้องใส่เพราะมีการใช้ State สำหรับ Dropdown

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function Home() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* --- NAVBAR --- */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        
        {/* Logo (CPAC Blue) */}
        <div className="flex items-center gap-2">
          <div className="bg-[#00AEEF] text-white font-bold px-3 py-1 rounded text-2xl tracking-tighter">
            CPAC
          </div>
        </div>

        {/* Menu Links */}
        <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-slate-600">
          <a href="#" className="text-[#00AEEF] border-b-2 border-[#00AEEF] pb-1">หน้าหลัก</a>
          <a href="#" className="hover:text-[#00AEEF] transition-colors">เกี่ยวกับเรา</a>
          
          {/* Dropdown สินค้าและบริการ */}
          <div className="relative group cursor-pointer" 
               onMouseEnter={() => setIsDropdownOpen(true)}
               onMouseLeave={() => setIsDropdownOpen(false)}>
            <div className="flex items-center gap-1 hover:text-[#00AEEF] transition-colors">
              สินค้าและบริการ <ChevronDown size={16} />
            </div>

            {/* Dropdown Menu Box */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 shadow-xl rounded-xl py-2 animate-in fade-in slide-in-from-top-1">
                <DropdownItem label="คอนกรีตผสมเสร็จ" />
                <DropdownItem label="คอนกรีตสำเร็จรูป" />
                <DropdownItem label="บริการงานคอนกรีต" />
                <DropdownItem label="บริการงานโครงสร้าง" />
              </div>
            )}
          </div>

          <a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-1">
            ข่าวสารและกิจกรรม <ChevronDown size={16} />
          </a>
          <a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-1">
            เอกสารดาวน์โหลด <ChevronDown size={16} />
          </a>
        </div>

        {/* Language & Extra */}
        <div className="flex items-center gap-4 text-slate-600 text-sm font-medium">
          <span className="flex items-center gap-1 cursor-pointer hover:text-[#00AEEF]">
            ภาษาไทย <ChevronDown size={14} />
          </span>
        </div>
      </nav>

      {/* --- HERO SECTION (Background ภาพท้องฟ้า) --- */}
      <div className="relative h-[400px] w-full bg-sky-200 overflow-hidden flex items-center justify-center">
        {/* จำลองภาพพื้นหลังท้องฟ้า */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-white opacity-40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-[#006633] drop-shadow-sm mb-4">
            การันตีความเป็นผู้นำด้านคอนกรีต
          </h1>
          <p className="text-xl text-slate-700 font-medium">
            สร้างความมั่นใจในทุกงานโครงสร้าง... เพื่อคุณ
          </p>
        </div>
      </div>

      {/* --- DASHBOARD CONTENT BELOW --- */}
      <div className="p-10 max-w-7xl mx-auto">
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold mb-4">ยินดีต้อนรับสู่ระบบ Dashboard</h2>
            <p className="text-slate-500 italic">เริ่มต้นการจัดการข้อมูลน้องวางใจได้จากเมนูด้านบน</p>
         </div>
      </div>
    </div>
  );
}

// Component ย่อยสำหรับรายการใน Dropdown
function DropdownItem({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 hover:text-[#00AEEF] transition-all cursor-pointer group border-b border-gray-50 last:border-0">
      <span className="text-sm font-semibold">{label}</span>
      <ChevronRight size={14} className="text-slate-300 group-hover:text-[#00AEEF]" />
    </div>
  );
}