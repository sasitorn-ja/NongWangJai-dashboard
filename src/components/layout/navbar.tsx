"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";


const dashboardLinks = [
  { title: "ติดตามคำสั่งจอง E-Booking - Company", href: "/dashboard/company" },
  { title: "ติดตามคำสั่งจอง E-Booking - Dealer", href: "/dashboard/dealer" },
];


const navLinkCls =
  "h-10 px-4 py-2 text-[15px] font-medium text-pt-neutral-500 hover:text-pt-primary-600 transition-colors inline-flex items-center whitespace-nowrap";


export function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileDashOpen, setMobileDashOpen] = React.useState(false);
  const [desktopDashOpen, setDesktopDashOpen] = React.useState(false);
  const dashRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dashRef.current && !dashRef.current.contains(e.target as Node)) {
        setDesktopDashOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  React.useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
        setMobileDashOpen(false);
        setDesktopDashOpen(false);
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <header className="w-full bg-white border-b border-pt-neutral-200 sticky top-0 z-50 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 lg:gap-10 min-w-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="bg-[#00BDF8] text-white font-bold px-3 py-1 rounded-md text-xl tracking-tighter transition-transform group-hover:scale-105">
              CPAC
            </div>
            <span className="text-[14px] font-bold text-pt-neutral-800 hidden sm:block whitespace-nowrap">
              Project Tracking
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/" className={navLinkCls}>หน้าหลัก</Link>

            <div className="relative" ref={dashRef}>
              <button
                onClick={() => setDesktopDashOpen((v) => !v)}
                className={`${navLinkCls} gap-1 rounded-md hover:bg-pt-neutral-50 focus:outline-none`}
              >
                Dashboard
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${desktopDashOpen ? "rotate-180" : ""}`}
                />
              </button>

              {desktopDashOpen && (
                <div className="absolute top-full left-0 mt-1 w-[340px] bg-white rounded-xl border border-pt-neutral-200 shadow-lg z-50 overflow-hidden">
                  <ul className="p-2 space-y-0.5">
                    {dashboardLinks.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setDesktopDashOpen(false)}
                          className="block px-3 py-2.5 rounded-lg text-[14px] font-medium text-pt-neutral-700
                                     hover:bg-pt-neutral-50 hover:text-pt-primary-600 transition-colors"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Link href="/NongWangJai" className={`${navLinkCls} gap-2`}>
              AI Nong Wang Jai
              <span className="inline-flex items-center justify-center bg-pt-error-500 text-white text-[10px] font-bold w-4 h-4 rounded-full leading-none">
                2
              </span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[12px] font-bold text-pt-neutral-700">User Name</p>
            <p className="text-[10px] text-pt-neutral-400">Admin</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-pt-neutral-100 border border-pt-neutral-200 shrink-0" />

          <button
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg
                       text-pt-neutral-600 hover:bg-pt-neutral-50 hover:text-pt-neutral-900
                       transition-colors focus:outline-none focus:ring-2 focus:ring-pt-primary-300"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-pt-neutral-100 bg-white px-4 pb-4">

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center h-11 text-[15px] font-medium text-pt-neutral-700
                       hover:text-pt-primary-600 border-b border-pt-neutral-100 transition-colors"
          >
            หน้าหลัก
          </Link>

          <div className="border-b border-pt-neutral-100">
            <button
              className="flex items-center justify-between w-full h-11 text-[15px] font-medium
                         text-pt-neutral-700 hover:text-pt-primary-600 transition-colors"
              onClick={() => setMobileDashOpen((v) => !v)}
            >
              Dashboard
              <ChevronDown
                className={`w-4 h-4 text-pt-neutral-400 transition-transform duration-200 ${
                  mobileDashOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {mobileDashOpen && (
              <div className="pb-2 pl-3 space-y-0.5">
                {dashboardLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-[13px] text-pt-neutral-600
                               hover:bg-pt-neutral-50 hover:text-pt-primary-600 transition-colors"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* AI Nong Wang Jai */}
          <Link
            href="/NongWangJai"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 h-11 text-[15px] font-medium text-pt-neutral-700
                       hover:text-pt-primary-600 transition-colors"
          >
            AI Nong Wang Jai
            <span className="inline-flex items-center justify-center bg-pt-error-500 text-white text-[10px] font-bold w-4 h-4 rounded-full leading-none">
              2
            </span>
          </Link>

          <div className="sm:hidden mt-3 pt-3 border-t border-pt-neutral-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pt-neutral-100 border border-pt-neutral-200 shrink-0" />
            <div>
              <p className="text-[12px] font-bold text-pt-neutral-700">User Name</p>
              <p className="text-[10px] text-pt-neutral-400">Admin</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}