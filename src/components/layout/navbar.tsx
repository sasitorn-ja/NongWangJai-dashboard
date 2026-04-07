"use client";

import * as React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Navbar() {
  return (
    <header className="w-full bg-white border-b border-pt-neutral-200 sticky top-0 z-50 px-8 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-10">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-[#00BDF8] text-white font-bold px-3 py-1 rounded-md text-xl tracking-tighter transition-transform group-hover:scale-105">
            CPAC
          </div>
          <span className="text-[14px] font-bold text-pt-neutral-800">
            Project Tracking
          </span>
        </Link>

        {/* Navigation Section */}
        <NavigationMenu className="hidden lg:flex" viewport={false}>
          <NavigationMenuList>
            {/* หน้าหลัก */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/"
                  className="h-10 px-4 py-2 text-[15px] font-medium text-pt-neutral-500 hover:text-pt-primary-600 transition-colors inline-flex items-center cursor-pointer"
                >
                  หน้าหลัก
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Dashboard */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Dashboard</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-full gap-1 p-2">
                  <ListItem title="ติดตามคำสั่งจอง E-Booking - Company" href="/dashboard/company" />
                  <ListItem title="ติดตามคำสั่งจอง E-Booking - Dealer" href="/dashboard/dealer" />
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Dashboard
            <NavigationMenuItem>
              <NavigationMenuTrigger>Dashboard</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-full gap-1 p-2">
                  <ListItem title="ติดตามคำสั่งจอง E-Booking" href="/dashboard" />
                  <ListItem title="สถานะการจัดส่ง" href="/shipping" />
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem> */}

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/NongWangJai"
                  className="h-10 px-4 py-2 text-[15px] font-medium text-pt-neutral-500 hover:text-pt-primary-600 transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  AI Nong Wang Jai
                  <span className="inline-flex items-center justify-center bg-pt-error-500 text-white text-[10px] font-bold w-4 h-4 rounded-full leading-none">
                    2
                  </span>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* User Profile Section */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden md:block">
          <p className="text-[12px] font-bold text-pt-neutral-700">User Name</p>
          <p className="text-[10px] text-pt-neutral-400">Admin</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-pt-neutral-100 border border-pt-neutral-200" />
      </div>
    </header>
  );
}

const ListItem = ({ title, href }: { title: string; href: string }) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        href={href}
        className="block select-none space-y-1 rounded-md px-3 py-2.5 leading-none no-underline outline-none transition-colors hover:bg-pt-neutral-50 focus:bg-pt-neutral-50"
      >
        <div className="text-[14px] font-medium leading-tight text-pt-neutral-700 hover:text-pt-primary-600">
          {title}
        </div>
      </Link>
    </NavigationMenuLink>
  </li>
);
