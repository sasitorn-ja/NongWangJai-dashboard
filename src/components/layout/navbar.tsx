"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  UserCircle,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export function Navbar() {
  return (
    <header className="w-full bg-background border-b border-border sticky top-0 z-50 px-8 py-3 flex items-center justify-between shadow-sm">
      {/* ส่วนโลโก้และเมนูหลัก */}
      <div className="flex items-center gap-10">
        {/* <Link
          href="/"
          className="bg-primary text-primary-foreground font-black px-4 py-1.5 rounded-sm text-2xl tracking-tighter transition hover:opacity-90"
        >
          CPAC
        </Link> */}

        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
                <NavigationMenuLink className="text-[15px] font-medium text-muted-foreground hover:text-primary cursor-pointer px-4">
                หน้าหลัก
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-[15px] font-medium text-muted-foreground hover:text-primary bg-transparent">
                Dashboard
              </NavigationMenuTrigger>
              {/* <NavigationMenuContent>
                <ul className="w-64 bg-card shadow-2xl rounded-pt-xl border border-border py-1">
                  <ListItem title="คอนกรีตผสมเสร็จ" />
                  <ListItem title="คอนกรีตสำเร็จรูป" />
                  <ListItem title="บริการงานคอนกรีต" />
                  <ListItem title="บริการงานโครงสร้าง" />
                </ul>
              </NavigationMenuContent> */}
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/dashboard-2" legacyBehavior passHref>
                <NavigationMenuLink className="text-[15px] font-medium text-muted-foreground hover:text-primary cursor-pointer px-4">
                  Dashboard 2
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* ส่วน Action ขวามือ (เปิดใช้งานและใช้สีตาม Token) */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-r pr-6 border-border text-muted-foreground">
          <Search
            size={20}
            className="cursor-pointer hover:text-primary transition-colors"
          />
          <div className="relative">
            <Bell
              size={20}
              className="cursor-pointer hover:text-destructive transition-colors"
            />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
          </div>
        </div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden md:block leading-tight">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Store Admin
            </p>
            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              Sasitorn
            </p>
          </div>
          <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center border border-border group-hover:border-primary transition-all">
            <UserCircle
              size={24}
              className="text-muted-foreground group-hover:text-primary"
            />
          </div>
          <ChevronDown size={14} className="text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}

const ListItem = ({ title }: { title: string }) => (
  <li className="border-b border-border last:border-0">
    <NavigationMenuLink asChild>
      <div className="flex items-center justify-between px-5 py-4 hover:bg-accent cursor-pointer group transition-all">
        <span className="text-[14px] font-semibold text-foreground group-hover:text-primary">
          {title}
        </span>
        <ChevronRight
          size={14}
          className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1"
        />
      </div>
    </NavigationMenuLink>
  </li>
);
