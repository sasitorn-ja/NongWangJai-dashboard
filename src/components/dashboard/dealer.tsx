"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download, ChevronDown, SlidersHorizontal } from "lucide-react";

import { DashboardService } from "@/services/dashboard";
import {
  CustomerGroup,
  OrderDetail,
  SiteDetail,
} from "@/types/dashboard";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// ── shared Dialog + sub-components ──────────────────────────────────────────
import {
  OrderDetailDialog,
  DialogOrderRow,
  StatusBadge,
  DPBadge,
  MiniProgress,
  sumDelivered,
} from "@/components/dashboard/order-detail-dialog";

const PAGE_SIZE = 10;

const HEADERS = [
  ["เวลา Update", "w-[86px]"],
  ["ลูกค้า / ผู้รับเหมา", ""],
  ["Site", "w-[130px]"],
  ["รายการสั่ง", "w-[160px]"],
  ["ปริมาณ / ส่งแล้ว", "w-[110px] text-right"],
  ["คงเหลือ", "w-[80px] text-right"],
  ["วัน/เวลาเท", "w-[100px] text-center"],
  ["สถานะ", "w-[240px]"],
  ["", "w-[90px] text-center"],
] as const;

const STATUS_OPTIONS = [
  "ALL",
  "อยู่ระหว่างจัดส่ง",
  "รอดำเนินการ",
  "ดำเนินการครบถ้วน",
  "ยกเลิกรายการ",
  "รอ Site code",
] as const;

const DP_OPTIONS = [
  "ALL",
  "รอปริมาณรวม",
  "รอเปิด DP",
  "DP เปิดแล้ว",
  "DP ครบ",
] as const;

const pad = (n: number) => `${n}`.padStart(2, "0");

const formatNow = (date: Date) =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

const normalizeDate = (value?: string) => {
  if (!value || value === "-") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyyRaw] = m;
  const yyyy = Number(yyyyRaw) > 2400 ? Number(yyyyRaw) - 543 : Number(yyyyRaw);
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeTime = (value?: string) => {
  if (!value || value === "-") return "";
  const m = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
};

function getPaginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

function StatCard({
  label,
  value,
  sub,
  accentClass,
}: {
  label: string;
  value: string;
  sub: string;
  accentClass: string;
}) {
  return (
    <div
      className={`bg-white border border-pt-neutral-200 border-l-4 ${accentClass} rounded-[20px] sm:rounded-[24px] px-3 py-2.5 sm:px-4 sm:py-3.5`}
      style={{ boxShadow: "var(--pt-shadow-sm)" }}
    >
      <p className="text-[9px] sm:text-[10px] font-bold text-pt-neutral-500 uppercase tracking-widest mb-1 leading-tight">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] sm:text-[26px] font-bold text-pt-neutral-900 leading-none font-mono">
          {value}
        </span>
        <span className="text-[11px] text-pt-neutral-500 font-medium">{sub}</span>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 w-full sm:w-auto">
      <label className="text-[10px] font-semibold text-pt-neutral-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

// FlatOrderRow สำหรับ dealer — ไม่มี dealerId/dealerName (Dealer view ข้อมูลตัวเอง)
type FlatOrderRow = DialogOrderRow;

// ── MobileOrderCard ─────────────────────────────────────────────────────────
function MobileOrderCard({
  row,
  onOpenDetail,
}: {
  row: FlatOrderRow;
  onOpenDetail: (row: FlatOrderRow) => void;
}) {
  const sent = sumDelivered(row.order);
  const rem = Math.max(row.order.totalQty - sent, 0);
  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {row.order.updateTime && row.order.updateTime !== "-" ? (
            <span className="font-mono text-[11px] font-medium text-pt-neutral-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-pt-success-500 animate-pulse shrink-0" />
              {row.order.updateTime}
            </span>
          ) : <span className="text-[11px] text-pt-neutral-400">—</span>}
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono font-semibold text-[12px] text-pt-primary-700">{row.site.siteCode}</p>
          <p className="text-[10px] text-pt-neutral-400 line-clamp-1 max-w-[140px] text-right">{row.site.siteName}</p>
        </div>
      </div>
      <div className="bg-pt-neutral-50 rounded-[12px] px-3 py-2">
        <p className="font-semibold text-[12px] text-pt-neutral-900 leading-tight">{row.customer.companyName}</p>
        <p className="text-[10px] text-pt-neutral-500 mt-0.5">{row.customer.id} · {row.customer.phone}</p>
        <p className="text-[10px] text-pt-neutral-400">Line: {row.customer.contactLine}</p>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[11px] text-pt-neutral-700 line-clamp-2">{row.order.product}</p>
          <p className="text-[10px] font-mono text-pt-neutral-400">{row.order.orderId}</p>
          {row.order.schedDate && (
            <p className="text-[10px] text-pt-neutral-500 mt-0.5">
              เท: {row.order.schedDate}{row.order.schedTime ? ` ${row.order.schedTime}` : ""}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-[12px] font-semibold text-pt-neutral-700">
            {row.order.totalQty.toLocaleString()} <span className="text-[9px] text-pt-neutral-400">คิว</span>
          </p>
          <p className={`font-mono text-[11px] font-semibold ${sent > 0 ? "text-pt-primary-600" : "text-pt-neutral-300"}`}>
            ส่งแล้ว {sent.toLocaleString()}
          </p>
          <p className={`font-mono text-[11px] font-bold ${rem === 0 ? "text-pt-success-600" : row.order.status === "ยกเลิกรายการ" ? "text-pt-neutral-400 line-through" : "text-pt-neutral-900"}`}>
            คงเหลือ {rem.toLocaleString()}
          </p>
          <MiniProgress sent={sent} total={row.order.totalQty} status={row.order.status} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          <StatusBadge status={row.order.status} />
          <DPBadge status={row.order.dpStatus} plant={row.order.dpPlant} />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 rounded-[10px] text-[11px] border-pt-neutral-300 hover:bg-pt-primary-50 hover:border-pt-primary-400 hover:text-pt-primary-700 shrink-0"
          onClick={() => onOpenDetail(row)}
        >
          ดูรายละเอียด
        </Button>
      </div>
    </div>
  );
}

function FlatOrderTableRow({
  row,
  onOpenDetail,
}: {
  row: FlatOrderRow;
  onOpenDetail: (row: FlatOrderRow) => void;
}) {
  const sent = sumDelivered(row.order);
  const rem = Math.max(row.order.totalQty - sent, 0);

  return (
    <TableRow className="hover:bg-pt-neutral-50 transition-colors border-b border-pt-neutral-100">
      {/* เวลา */}
      <TableCell className="w-[86px] py-3">
        {row.order.updateTime && row.order.updateTime !== "-" ? (
          <span className="font-mono text-[11px] font-medium text-pt-neutral-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-pt-success-500 animate-pulse shrink-0" />
            {row.order.updateTime}
          </span>
        ) : (
          <span className="text-pt-neutral-400 text-[11px]">—</span>
        )}
      </TableCell>

      {/* ลูกค้า */}
      <TableCell className="py-3">
        <p className="font-semibold text-[12px] text-pt-neutral-900 leading-tight">
          {row.customer.companyName}
        </p>
        <p className="text-[11px] text-pt-neutral-500 mt-0.5">
          {row.customer.id} · {row.customer.phone}
        </p>
        <p className="text-[11px] text-pt-neutral-400">Line: {row.customer.contactLine}</p>
      </TableCell>

      {/* Site */}
      <TableCell className="w-[130px] py-3">
        <p className="font-mono font-semibold text-[12px] text-pt-primary-700">
          {row.site.siteCode}
        </p>
        <p className="text-[11px] text-pt-neutral-500 mt-0.5 leading-tight line-clamp-2">
          {row.site.siteName}
        </p>
      </TableCell>

      {/* รายการสั่ง */}
      <TableCell className="w-[160px] py-3">
        <p className="font-semibold text-[11px] text-pt-neutral-700 line-clamp-2">{row.order.product}</p>
        <p className="text-[10px] font-mono text-pt-neutral-400 mt-0.5">{row.order.orderId}</p>
      </TableCell>

      {/* ปริมาณ / ส่งแล้ว */}
      <TableCell className="w-[110px] text-right py-3">
        <p className="font-mono font-semibold text-[12px] text-pt-neutral-700">
          {row.order.totalQty.toLocaleString()}
          <span className="text-[10px] text-pt-neutral-400 ml-0.5">คิว</span>
        </p>
        <p className={`font-mono text-[12px] font-semibold mt-0.5 ${sent > 0 ? "text-pt-primary-600" : "text-pt-neutral-300"}`}>
          {sent.toLocaleString()}
          <span className="text-[10px] text-pt-neutral-400 ml-0.5">ส่ง</span>
        </p>
        <MiniProgress sent={sent} total={row.order.totalQty} status={row.order.status} />
      </TableCell>

      {/* คงเหลือ */}
      <TableCell className="w-[80px] text-right py-3">
        <span className={`font-mono font-semibold text-[13px] ${
          rem === 0 ? "text-pt-success-600"
          : row.order.status === "ยกเลิกรายการ" ? "text-pt-neutral-400 line-through"
          : "text-pt-neutral-900"
        }`}>
          {rem.toLocaleString()}
        </span>
        <p className="text-[10px] text-pt-neutral-400">คิว</p>
      </TableCell>

      {/* วัน/เวลาเท */}
      <TableCell className="w-[100px] text-center py-3">
        <p className="text-[11px] font-medium text-pt-neutral-700">{row.order.schedDate || "—"}</p>
        <p className="text-[10px] font-mono text-pt-neutral-500 mt-0.5">{row.order.schedTime || "-"}</p>
      </TableCell>

      {/* สถานะ (คำสั่ง + DP รวม) */}
      <TableCell className="w-[240px] py-3">
        <div className="flex flex-wrap gap-1">
          <StatusBadge status={row.order.status} />
          <DPBadge status={row.order.dpStatus} plant={row.order.dpPlant} />
        </div>
      </TableCell>

      {/* ปุ่ม */}
      <TableCell className="w-[90px] text-center py-3">
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 rounded-[10px] text-[11px] border-pt-neutral-300 hover:bg-pt-primary-50 hover:border-pt-primary-400 hover:text-pt-primary-700"
          onClick={() => onOpenDetail(row)}
        >
          ดูรายละเอียด
        </Button>
      </TableCell>
    </TableRow>
  );
}

type DealerDashboardProps = {
  dealerId?: string;
};

export default function DealerDashboard({
  dealerId = "DLR-1234",
}: DealerDashboardProps) {
  const allData = DashboardService.getDealerDashboardData(dealerId);

  const [draft, setDraft] = useState({
    searchCust: "",
    searchSite: "",
    status: "ALL",
    dp: "ALL",
    pourDate: "",
    pourTime: "",
  });

  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const [dateTimeNow, setDateTimeNow] = useState(formatNow(new Date()));
  const [detailRow, setDetailRow] = useState<FlatOrderRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setDateTimeNow(formatNow(new Date())), 1000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo<CustomerGroup[]>(() => {
    return allData
      .map((customer) => {
        const customerMatch =
          !filters.searchCust ||
          [customer.companyName, customer.contactLine, customer.id].some((v) =>
            v.toLowerCase().includes(filters.searchCust.toLowerCase()),
          );

        if (!customerMatch) return null;

        const sites = customer.sites
          .map((site) => {
            const siteMatch =
              !filters.searchSite ||
              [site.siteCode, site.siteName].some((v) =>
                v.toLowerCase().includes(filters.searchSite.toLowerCase()),
              );

            if (!siteMatch) return null;

            const orders = site.orders.filter((o) => {
              const statusMatch = filters.status === "ALL" || o.status === filters.status;
              const dpMatch = filters.dp === "ALL" || o.dpStatus === filters.dp;
              const dateMatch = !filters.pourDate || normalizeDate(o.schedDate) === filters.pourDate;
              const timeMatch = !filters.pourTime || normalizeTime(o.schedTime) === filters.pourTime;
              return statusMatch && dpMatch && dateMatch && timeMatch;
            });

            return orders.length ? { ...site, orders } : null;
          })
          .filter(Boolean) as SiteDetail[];

        return sites.length ? { ...customer, sites } : null;
      })
      .filter(Boolean) as CustomerGroup[];
  }, [allData, filters]);

  const flatRows = useMemo<FlatOrderRow[]>(() => {
    return filtered.flatMap((customer) =>
      customer.sites.flatMap((site) =>
        site.orders.map((order) => ({
          customer,
          site,
          order,
        })),
      ),
    );
  }, [filtered]);

  useEffect(() => {
    setPage(1);
  }, [filters, dealerId]);

  const totalPages = Math.max(1, Math.ceil(flatRows.length / PAGE_SIZE));
  const paginated = flatRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allOrders = flatRows.map((r) => r.order);
  const totalOrders = flatRows.length;
  const totalSites = filtered.flatMap((c) => c.sites).length;
  const dealerName = filtered[0]?.dealerName || dealerId;

  const updateDraft = (key: keyof typeof draft, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSearch = () => setFilters(draft);

  const resetFilters = () => {
    const empty = {
      searchCust: "",
      searchSite: "",
      status: "ALL",
      dp: "ALL",
      pourDate: "",
      pourTime: "",
    };
    setDraft(empty);
    setFilters(empty);
  };

  const openDetail = (row: FlatOrderRow) => {
    setDetailRow(row);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div
        className="bg-white border-b border-pt-neutral-200 shrink-0"
        style={{ boxShadow: "var(--pt-shadow-sm)" }}
      >
        {/* ── Title bar — always visible ── */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] sm:text-[18px] font-bold text-pt-neutral-900 leading-tight">
              Dashboard ติดตามคำสั่งจอง EBooking — งานจองคอนกรีต
            </h1>
            <p className="text-[11px] sm:text-[12px] text-pt-neutral-500 mt-0.5">
              Dealer: <span className="font-semibold text-pt-neutral-900">{dealerName}</span>
              <span className="ml-2 text-pt-neutral-400">({dealerId})</span>
            </p>
            <p className="text-[11px] sm:text-[12px] text-pt-neutral-500">อัปเดตล่าสุด {dateTimeNow}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-[12px] rounded-[16px] bg-white border-pt-neutral-200 text-pt-neutral-700 hover:bg-pt-primary-50 hover:border-pt-primary-300 hover:text-pt-primary-600 hidden sm:flex"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
            >
              <Download size={14} /> Export Excel
            </Button>
            <button
              type="button"
              onClick={() => setHeaderCollapsed((v) => !v)}
              className="sm:hidden flex items-center gap-1 text-[11px] text-pt-neutral-500 border border-pt-neutral-200 rounded-full px-2.5 py-1 bg-white"
            >
              {headerCollapsed ? "สถิติ" : "ซ่อน"}
              <ChevronDown size={12} className={`transition-transform duration-200 ${headerCollapsed ? "" : "rotate-180"}`} />
            </button>
          </div>
        </div>

        {/* ── Stat cards — collapsible on mobile ── */}
        <div className={`px-4 sm:px-6 pb-3 sm:pb-4 sm:block ${headerCollapsed ? "hidden" : "block"}`}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3">
          <StatCard
            label="Dealer"
            value={dealerId}
            sub="ที่กำลังดู"
            accentClass="border-l-pt-primary-600"
          />
          <StatCard
            label="จำนวนลูกค้า"
            value={String(filtered.length)}
            sub="ราย"
            accentClass="border-l-pt-secondary-dark-accent"
          />
          <StatCard
            label="จำนวน Site code ที่เปิด"
            value={String(totalSites)}
            sub="ไซต์"
            accentClass="border-l-pt-warning-500"
          />
          <StatCard
            label="จำนวนคำสั่งจอง"
            value={String(totalOrders)}
            sub="รายการ"
            accentClass="border-l-pt-neutral-700"
          />
          <StatCard
            label="คำสั่งที่ต้องติดตาม"
            value={String(allOrders.filter((o) => o.status === "อยู่ระหว่างจัดส่ง").length)}
            sub="รายการ"
            accentClass="border-l-pt-success-600"
          />
          <StatCard
            label="คำสั่งที่มีปัญหา"
            value={String(allOrders.filter((o) => o.status === "ยกเลิกรายการ").length)}
            sub="รายการ"
            accentClass="border-l-pt-error-600"
          />
        </div>
        </div>
      </div>

      {/* ── Filter bar — collapsible on mobile ── */}
      <div className="bg-white border-b border-pt-neutral-200 shrink-0">
        <div className="px-4 sm:px-6 py-2 sm:py-0 flex items-center justify-between sm:hidden">
          <span className="text-[11px] font-semibold text-pt-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal size={12} /> ตัวกรอง
          </span>
          <button
            type="button"
            onClick={() => setFilterCollapsed((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-pt-neutral-500 border border-pt-neutral-200 rounded-full px-2.5 py-1 bg-white"
          >
            {filterCollapsed ? "แสดง" : "ซ่อน"}
            <ChevronDown size={12} className={`transition-transform duration-200 ${filterCollapsed ? "" : "rotate-180"}`} />
          </button>
        </div>
        <div className={`px-4 sm:px-6 py-3 sm:block ${filterCollapsed ? "hidden" : "block"}`}>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5 items-end">
          <FilterGroup label="ลูกค้า / Line">
            <Input
              placeholder="ชื่อลูกค้า, Line ID..."
              className="h-9 text-[12px] w-full sm:w-52 rounded-[16px] border-pt-neutral-300 placeholder:text-pt-neutral-400 focus:border-pt-primary-500 focus:ring-0"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
              value={draft.searchCust}
              onChange={(e) => updateDraft("searchCust", e.target.value)}
            />
          </FilterGroup>

          <FilterGroup label="Site code">
            <Input
              placeholder="รหัส Site code"
              className="h-9 text-[12px] w-full sm:w-40 rounded-[16px] border-pt-neutral-300 placeholder:text-pt-neutral-400 focus:border-pt-primary-500 focus:ring-0"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
              value={draft.searchSite}
              onChange={(e) => updateDraft("searchSite", e.target.value)}
            />
          </FilterGroup>

          <FilterGroup label="วันเท">
            <Input
              type="date"
              className="h-9 text-[12px] w-full sm:w-40 rounded-[16px] border-pt-neutral-300 focus:border-pt-primary-500 focus:ring-0"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
              value={draft.pourDate}
              onChange={(e) => updateDraft("pourDate", e.target.value)}
            />
          </FilterGroup>

          <FilterGroup label="เวลาเท">
            <Input
              type="time"
              className="h-9 text-[12px] w-full sm:w-32 rounded-[16px] border-pt-neutral-300 focus:border-pt-primary-500 focus:ring-0"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
              value={draft.pourTime}
              onChange={(e) => updateDraft("pourTime", e.target.value)}
            />
          </FilterGroup>

          <FilterGroup label="สถานะงาน">
            <Select value={draft.status} onValueChange={(v) => updateDraft("status", v)}>
              <SelectTrigger
                className="h-9 text-[12px] w-full sm:w-44 rounded-[16px] border-pt-neutral-300"
                style={{ boxShadow: "var(--pt-shadow-xs)" }}
              >
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v === "ALL" ? "สถานะทั้งหมด" : v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterGroup>

          <FilterGroup label="สถานะ DP">
            <Select value={draft.dp} onValueChange={(v) => updateDraft("dp", v)}>
              <SelectTrigger
                className="h-9 text-[12px] w-40 rounded-[16px] border-pt-neutral-300"
                style={{ boxShadow: "var(--pt-shadow-xs)" }}
              >
                <SelectValue placeholder="DP ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                {DP_OPTIONS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v === "ALL" ? "DP ทั้งหมด" : v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterGroup>

          <div className="flex gap-2 col-span-2 sm:col-span-1 sm:self-end">
            <Button
              size="sm"
              className="h-9 px-5 rounded-[16px] text-[12px] font-semibold bg-pt-neutral-900 text-white hover:bg-pt-neutral-800"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
              onClick={handleSearch}
            >
              ค้นหา
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-3 rounded-[16px] text-[12px] text-pt-neutral-500 hover:bg-pt-neutral-100 hover:text-pt-neutral-700"
              onClick={resetFilters}
            >
              ล้างตัวกรอง
            </Button>
          </div>
        </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-5">
        <div
          className="bg-white rounded-[20px] sm:rounded-[24px] border border-pt-neutral-200 overflow-hidden"
          style={{ boxShadow: "var(--pt-shadow-sm)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2 bg-pt-neutral-50 border-b border-pt-neutral-200 gap-0.5">
            <p className="text-[12px] text-pt-neutral-500">
              แสดง <strong className="text-pt-neutral-900">{totalOrders}</strong> รายการ
              {flatRows.length > 0 && (
                <span className="ml-2 text-pt-neutral-400">
                  (หน้า {page} จาก {totalPages})
                </span>
              )}
            </p>
            <p className="text-[10px] text-pt-neutral-400">
              ▸ กด “รายละเอียด” เพื่อดูข้อมูลลูกค้า, site, DP และประวัติการจัดส่ง
            </p>
          </div>

          {/* Mobile card layout */}
          <div className="block sm:hidden divide-y divide-pt-neutral-100">
            {paginated.length > 0 ? (
              paginated.map((row) => (
                <MobileOrderCard
                  key={`${row.customer.id}-${row.site.siteCode}-${row.order.orderId}`}
                  row={row}
                  onOpenDetail={openDetail}
                />
              ))
            ) : (
              <div className="h-32 flex flex-col items-center justify-center">
                <p className="text-2xl mb-2">🔍</p>
                <p className="text-[14px] font-medium text-pt-neutral-500">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                <p className="text-[12px] text-pt-neutral-400 mt-1">ลองปรับตัวกรองแล้วค้นหาใหม่</p>
              </div>
            )}
          </div>

          {/* Desktop table layout */}
          <div className="hidden sm:block">
            <Table className="table-auto w-full">
              <TableHeader>
                <TableRow className="bg-pt-neutral-100 hover:bg-pt-neutral-100 border-b-2 border-pt-neutral-200">
                  {HEADERS.map(([label, cls]) => (
                    <TableHead
                      key={label}
                      className={`${cls} text-[10px] font-bold text-pt-neutral-600 uppercase tracking-wider h-9 sticky top-0 bg-pt-neutral-100 z-10`}
                    >
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.length > 0 ? (
                  paginated.map((row) => (
                    <FlatOrderTableRow
                      key={`${row.customer.id}-${row.site.siteCode}-${row.order.orderId}`}
                      row={row}
                      onOpenDetail={openDetail}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center">
                      <p className="text-2xl mb-2">🔍</p>
                      <p className="text-[14px] font-medium text-pt-neutral-500">
                        ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                      </p>
                      <p className="text-[12px] text-pt-neutral-400 mt-1">
                        ลองปรับตัวกรองแล้วค้นหาใหม่
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {flatRows.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 border-t border-pt-neutral-200 bg-white">
              <p className="text-[11px] text-pt-neutral-400 shrink-0">
                หน้า <strong className="text-pt-neutral-700">{page}</strong> จาก{" "}
                <strong className="text-pt-neutral-700">{totalPages}</strong> · {flatRows.length} รายการทั้งหมด
              </p>

              <Pagination className="justify-start sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {getPaginationRange(page, totalPages).map((item, i) =>
                    item === "..." ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          onClick={() => setPage(item as number)}
                          isActive={page === item}
                          className="cursor-pointer"
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      <OrderDetailDialog
        row={detailRow}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}