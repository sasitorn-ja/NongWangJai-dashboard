"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download, History, Search, X } from "lucide-react";

import { DashboardService } from "@/services/dashboard";
import {
  CustomerGroup,
  DealerGroup,
  DPStatusType,
  OrderDetail,
  OrderStatusType,
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
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const PAGE_SIZE = 10;

const HEADERS = [
  ["เวลา Update", "w-[86px]"],
  ["Dealer", "w-[160px]"],
  ["ลูกค้า / ผู้รับเหมา", "w-[210px]"],
  ["Site code", "w-[140px]"],
  ["รายการสั่งคอนกรีต", "w-[190px]"],
  ["ปริมาณสั่ง", "w-[88px] text-right"],
  ["ส่งแล้ว", "w-[88px] text-right"],
  ["คงเหลือ", "w-[88px] text-right"],
  ["วัน/เวลาเท", "w-[104px] text-center"],
  ["สถานะคำสั่ง", "w-[128px]"],
  ["สถานะ DP", "w-[112px]"],
  ["ดูประวัติ", "w-[96px] text-center"],
] as const;

const ORDER_STYLE: Record<
  OrderStatusType,
  { badge: string; dot: string; bar: string }
> = {
  อยู่ระหว่างจัดส่ง: {
    badge: "bg-pt-primary-100 text-pt-primary-700 border-pt-primary-300",
    dot: "bg-pt-primary-600 animate-pulse",
    bar: "bg-pt-primary-600",
  },
  ดำเนินการครบถ้วน: {
    badge: "bg-pt-success-100 text-pt-success-700 border-pt-success-300",
    dot: "bg-pt-success-600",
    bar: "bg-pt-success-600",
  },
  รอดำเนินการ: {
    badge: "bg-pt-warning-100 text-pt-warning-600 border-pt-warning-500",
    dot: "bg-pt-warning-500",
    bar: "bg-pt-neutral-400",
  },
  ยกเลิกรายการ: {
    badge: "bg-pt-error-100 text-pt-error-700 border-pt-error-200",
    dot: "bg-pt-error-600",
    bar: "bg-pt-error-200",
  },
  "รอ Site code": {
    badge: "bg-pt-neutral-100 text-pt-neutral-600 border-pt-neutral-300",
    dot: "bg-pt-neutral-400",
    bar: "bg-pt-neutral-200",
  },
};

const DP_STYLE: Record<DPStatusType, string> = {
  "DP ครบ": "bg-pt-success-100 text-pt-success-700 border-pt-success-300",
  "DP เปิดแล้ว": "bg-pt-primary-100 text-pt-primary-700 border-pt-primary-300",
  "รอเปิด DP": "bg-pt-warning-100 text-pt-warning-600 border-pt-warning-500",
  รอปริมาณรวม: "bg-pt-neutral-100 text-pt-neutral-600 border-pt-neutral-300",
};

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

const sumDelivered = (o: OrderDetail) =>
  o.deliveries.reduce((sum, d) => sum + d.qty, 0);

const progress = (sent: number, total: number) =>
  total > 0 ? Math.round((sent / total) * 100) : 0;

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

function StatusBadge({ status }: { status: OrderStatusType }) {
  const s = ORDER_STYLE[status];
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-bold gap-1.5 rounded-[8px] uppercase tracking-wide ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </Badge>
  );
}

function DPBadge({ status, plant }: { status: DPStatusType; plant: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Badge
        variant="outline"
        className={`text-[10px] font-bold w-fit rounded-[8px] uppercase tracking-wide ${DP_STYLE[status]}`}
      >
        {status}
      </Badge>
      {!!plant && (
        <span className="text-[10px] text-pt-neutral-500 font-mono pl-0.5">
          {plant}
        </span>
      )}
    </div>
  );
}

function MiniProgress({
  sent,
  total,
  status,
}: {
  sent: number;
  total: number;
  status: OrderStatusType;
}) {
  const pct = progress(sent, total);

  return (
    <>
      <div className="w-full bg-pt-neutral-100 rounded-full h-1.5 mt-1 overflow-hidden">
        <div
          className={`${ORDER_STYLE[status].bar} h-full rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-pt-neutral-500 mt-0.5 text-right">{pct}%</p>
    </>
  );
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
      className={`bg-white border border-pt-neutral-200 border-l-4 ${accentClass} rounded-[24px] px-4 py-3.5`}
      style={{ boxShadow: "var(--pt-shadow-sm)" }}
    >
      <p className="text-[10px] font-bold text-pt-neutral-500 uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-[26px] font-bold text-pt-neutral-900 leading-none font-mono">
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
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold text-pt-neutral-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

type DealerMultiSelectProps = {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  onSelectAll: () => void;
};

function DealerMultiSelect({
  options,
  selectedValues,
  onToggle,
  onClear,
  onSelectAll,
}: DealerMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedCount = selectedValues.length;

  return (
    <div className="relative w-64">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-full rounded-[16px] border border-pt-neutral-300 bg-white px-3 text-left text-[12px] shadow-sm flex items-center justify-between"
      >
        <span className="truncate text-pt-neutral-700">
          {selectedCount === 0
            ? "Dealer ทั้งหมด"
            : selectedCount === 1
              ? options.find((o) => o.value === selectedValues[0])?.label ?? "เลือก Dealer"
              : `เลือกแล้ว ${selectedCount} Dealer`}
        </span>
        <Search size={14} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-[16px] border border-pt-neutral-200 bg-white shadow-lg p-2">
          <div className="flex items-center justify-between gap-2 px-1 pb-2 border-b border-pt-neutral-100">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-[11px] font-medium text-pt-primary-600 hover:underline"
            >
              เลือกทั้งหมด
            </button>
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] font-medium text-pt-neutral-500 hover:underline"
            >
              ล้างที่เลือก
            </button>
          </div>

          <div className="max-h-60 overflow-auto py-2 space-y-1">
            {options.map((option) => {
              const checked = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-2 px-2 py-2 rounded-[10px] hover:bg-pt-neutral-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(option.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-[12px] text-pt-neutral-700">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type FlatOrderRow = {
  dealerId: string;
  dealerName: string;
  customer: CustomerGroup;
  site: SiteDetail;
  order: OrderDetail;
};

type DeliveryHistoryDialogProps = {
  row: FlatOrderRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DeliveryHistoryDialog({
  row,
  open,
  onOpenChange,
}: DeliveryHistoryDialogProps) {
  if (!row) return null;

  const sent = sumDelivered(row.order);
  const rem = Math.max(row.order.totalQty - sent, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>ประวัติการจัดส่ง</DialogTitle>
          <DialogDescription>
            {row.order.orderId} · {row.order.product}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-pt-neutral-200 p-3">
            <p className="text-[10px] uppercase text-pt-neutral-500 font-bold">Dealer</p>
            <p className="text-[13px] font-semibold text-pt-neutral-900 mt-1">{row.dealerName}</p>
            <p className="text-[11px] text-pt-neutral-500">{row.dealerId}</p>
          </div>

          <div className="rounded-xl border border-pt-neutral-200 p-3">
            <p className="text-[10px] uppercase text-pt-neutral-500 font-bold">ลูกค้า</p>
            <p className="text-[13px] font-semibold text-pt-neutral-900 mt-1">
              {row.customer.companyName}
            </p>
            <p className="text-[11px] text-pt-neutral-500">{row.customer.phone}</p>
          </div>

          <div className="rounded-xl border border-pt-neutral-200 p-3">
            <p className="text-[10px] uppercase text-pt-neutral-500 font-bold">Site</p>
            <p className="text-[13px] font-semibold text-pt-neutral-900 mt-1">
              {row.site.siteCode}
            </p>
            <p className="text-[11px] text-pt-neutral-500">{row.site.siteName}</p>
          </div>

          <div className="rounded-xl border border-pt-neutral-200 p-3">
            <p className="text-[10px] uppercase text-pt-neutral-500 font-bold">ความคืบหน้า</p>
            <p className="text-[13px] font-semibold text-pt-neutral-900 mt-1">
              {progress(sent, row.order.totalQty)}%
            </p>
            <p className="text-[11px] text-pt-neutral-500">
              ส่งแล้ว {sent.toLocaleString()} / คงเหลือ {rem.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-pt-neutral-200 overflow-hidden">
          <div className="px-4 py-3 bg-pt-neutral-50 border-b border-pt-neutral-200">
            <p className="text-[12px] font-semibold text-pt-neutral-900">
              รายการรอบจัดส่ง {row.order.deliveries.length} รอบ
            </p>
          </div>

          <div className="max-h-[380px] overflow-auto">
            {row.order.deliveries.length > 0 ? (
              <div className="divide-y divide-pt-neutral-200">
                {row.order.deliveries.map((d, i) => (
                  <div key={i} className="px-4 py-3 grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-2">
                      <p className="text-[12px] font-mono text-pt-neutral-900">{d.date}</p>
                      <p className="text-[11px] font-mono text-pt-neutral-500">{d.time}</p>
                    </div>
                    <div className="col-span-5">
                      <p className="text-[12px] text-pt-neutral-900">{d.note}</p>
                    </div>
                    <div className="col-span-2 text-[12px] text-pt-neutral-500">{d.truck}</div>
                    <div className="col-span-3 text-right">
                      <p className="text-[13px] font-semibold text-pt-primary-600 font-mono">
                        {d.qty.toLocaleString()} คิว
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-[12px] text-pt-neutral-500">
                ไม่มีประวัติการจัดส่ง
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FlatOrderTableRow({
  row,
  onOpenHistory,
}: {
  row: FlatOrderRow;
  onOpenHistory: (row: FlatOrderRow) => void;
}) {
  const sent = sumDelivered(row.order);
  const rem = Math.max(row.order.totalQty - sent, 0);

  return (
    <TableRow className="hover:bg-pt-neutral-50 transition-colors border-b border-pt-neutral-200">
      <TableCell className="w-[86px]">
        {row.order.updateTime && row.order.updateTime !== "-" ? (
          <span className="font-mono text-[12px] font-medium text-pt-neutral-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-pt-success-500 animate-pulse shrink-0" />
            {row.order.updateTime}
          </span>
        ) : (
          <span className="text-pt-neutral-400 text-[11px]">—</span>
        )}
      </TableCell>

      <TableCell className="w-[160px] min-w-[160px]">
        <p className="font-semibold text-[12px] text-pt-neutral-900 leading-tight">
          {row.dealerName}
        </p>
        <p className="text-[10px] text-pt-neutral-500 font-mono mt-0.5">
          {row.dealerId}
        </p>
      </TableCell>

      <TableCell className="w-[210px] min-w-[210px]">
        <p className="font-semibold text-[13px] text-pt-neutral-900 leading-tight">
          {row.customer.companyName}
        </p>
        <p className="text-[11px] text-pt-neutral-500 mt-0.5">
          {row.customer.id} · {row.customer.phone}
        </p>
        <p className="text-[11px] text-pt-neutral-500 mt-0.5">
          Line: {row.customer.contactLine}
        </p>
      </TableCell>

      <TableCell className="w-[140px] min-w-[140px]">
        <p className="font-mono font-semibold text-[12px] text-pt-primary-700">
          {row.site.siteCode}
        </p>
        <p className="text-[11px] text-pt-neutral-500 mt-1 leading-tight">
          {row.site.siteName}
        </p>
      </TableCell>

      <TableCell className="w-[190px]">
        <p className="font-semibold text-[12px] text-pt-neutral-700">{row.order.product}</p>
        <p className="text-[11px] text-pt-neutral-500 leading-tight">{row.order.spec}</p>
        <p className="text-[10px] font-mono text-pt-neutral-400 mt-0.5">{row.order.orderId}</p>
      </TableCell>

      <TableCell className="text-right w-[88px]">
        <span className="font-mono font-semibold text-[13px] text-pt-neutral-700">
          {row.order.totalQty.toLocaleString()}
        </span>
        <p className="text-[10px] text-pt-neutral-500">คิว</p>
      </TableCell>

      <TableCell className="text-right w-[88px]">
        <span
          className={`font-mono font-semibold text-[13px] ${
            sent > 0 ? "text-pt-primary-600" : "text-pt-neutral-400"
          }`}
        >
          {sent.toLocaleString()}
        </span>
        <MiniProgress sent={sent} total={row.order.totalQty} status={row.order.status} />
      </TableCell>

      <TableCell className="text-right w-[88px]">
        <span
          className={`font-mono font-semibold text-[13px] ${
            rem === 0
              ? "text-pt-success-600"
              : row.order.status === "ยกเลิกรายการ"
                ? "text-pt-neutral-400 line-through"
                : "text-pt-neutral-900"
          }`}
        >
          {rem.toLocaleString()}
        </span>
        <p className="text-[10px] text-pt-neutral-500">คิว</p>
      </TableCell>

      <TableCell className="text-center w-[104px]">
        <p className="text-[12px] font-medium text-pt-neutral-700">
          {row.order.schedDate || "—"}
        </p>
        {!!row.order.schedTime && (
          <p className="text-[11px] font-mono text-pt-neutral-500">
            {row.order.schedTime}
          </p>
        )}
      </TableCell>

      <TableCell className="w-[128px]">
        <StatusBadge status={row.order.status} />
      </TableCell>

      <TableCell className="w-[112px]">
        <DPBadge status={row.order.dpStatus} plant={row.order.dpPlant} />
      </TableCell>

      <TableCell className="w-[96px] text-center">
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-[12px] text-[11px]"
          onClick={() => onOpenHistory(row)}
        >
          ดูประวัติ
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function CompanyDashboard() {
  const allData = DashboardService.getCompanyDashboardData();

  const dealerOptions = useMemo(
    () =>
      allData.map((dealer) => ({
        value: dealer.dealerId,
        label: dealer.dealerName,
      })),
    [allData],
  );

  const [draft, setDraft] = useState({
    dealers: [] as string[],
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
  const [historyRow, setHistoryRow] = useState<FlatOrderRow | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setDateTimeNow(formatNow(new Date())), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleDealer = (dealerId: string) => {
    setDraft((prev) => {
      const exists = prev.dealers.includes(dealerId);
      return {
        ...prev,
        dealers: exists
          ? prev.dealers.filter((id) => id !== dealerId)
          : [...prev.dealers, dealerId],
      };
    });
  };

  const clearDealerSelection = () => {
    setDraft((prev) => ({ ...prev, dealers: [] }));
  };

  const selectAllDealers = () => {
    setDraft((prev) => ({
      ...prev,
      dealers: dealerOptions.map((d) => d.value),
    }));
  };

  const filteredDealers = useMemo<DealerGroup[]>(() => {
    return allData
      .filter((dealer) => {
        if (filters.dealers.length === 0) return true;
        return filters.dealers.includes(dealer.dealerId);
      })
      .map((dealer) => {
        const customers = dealer.customers
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
                  const dateMatch =
                    !filters.pourDate || normalizeDate(o.schedDate) === filters.pourDate;
                  const timeMatch =
                    !filters.pourTime || normalizeTime(o.schedTime) === filters.pourTime;

                  return statusMatch && dpMatch && dateMatch && timeMatch;
                });

                return orders.length ? { ...site, orders } : null;
              })
              .filter(Boolean) as SiteDetail[];

            return sites.length ? { ...customer, sites } : null;
          })
          .filter(Boolean) as CustomerGroup[];

        return customers.length ? { ...dealer, customers } : null;
      })
      .filter(Boolean) as DealerGroup[];
  }, [allData, filters]);

  const flatRows = useMemo<FlatOrderRow[]>(() => {
    return filteredDealers.flatMap((dealer) =>
      dealer.customers.flatMap((customer) =>
        customer.sites.flatMap((site) =>
          site.orders.map((order) => ({
            dealerId: dealer.dealerId,
            dealerName: dealer.dealerName,
            customer,
            site,
            order,
          })),
        ),
      ),
    );
  }, [filteredDealers]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(flatRows.length / PAGE_SIZE));
  const paginated = flatRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalDealers = filteredDealers.length;
  const totalCustomers = filteredDealers.flatMap((d) => d.customers).length;
  const totalSites = filteredDealers.flatMap((d) =>
    d.customers.flatMap((c) => c.sites),
  ).length;
  const totalOrders = flatRows.length;

  const updateDraft = (key: keyof typeof draft, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSearch = () => setFilters(draft);

  const resetFilters = () => {
    const empty = {
      dealers: [] as string[],
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

  const openHistory = (row: FlatOrderRow) => {
    setHistoryRow(row);
    setHistoryOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div
        className="px-6 pt-5 pb-4 bg-white border-b border-pt-neutral-200 shrink-0"
        style={{ boxShadow: "var(--pt-shadow-sm)" }}
      >
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-pt-neutral-900 leading-tight">
              Dashboard บริษัท
            </h1>
            <p className="text-[12px] text-pt-neutral-500 mt-0.5">
              ติดตามคำสั่งจอง EBooking — งานจองคอนกรีต
            </p>
            <p className="text-[12px] text-pt-neutral-500 mt-0.5">
              อัปเดตล่าสุด {dateTimeNow}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-[12px] rounded-[16px] bg-white border-pt-neutral-200 text-pt-neutral-700 hover:bg-pt-primary-50 hover:border-pt-primary-300 hover:text-pt-primary-600"
            style={{ boxShadow: "var(--pt-shadow-xs)" }}
          >
            <Download size={14} /> Export Excel
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <StatCard
            label="จำนวน Dealer"
            value={String(totalDealers)}
            sub="ราย"
            accentClass="border-l-pt-primary-600"
          />
          <StatCard
            label="จำนวนลูกค้า"
            value={String(totalCustomers)}
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
            accentClass="border-l-pt-error-600"
          />
          <StatCard
            label="คำสั่งที่ต้องติดตาม"
            value={String(flatRows.filter((r) => r.order.status === "อยู่ระหว่างจัดส่ง").length)}
            sub="รายการ"
            accentClass="border-l-pt-success-600"
          />
          <StatCard
            label="คำสั่งที่มีปัญหา"
            value={String(flatRows.filter((r) => r.order.status === "ยกเลิกรายการ").length)}
            sub="รายการ"
            accentClass="border-l-pt-neutral-700"
          />
        </div>
      </div>

      <div className="px-6 py-3 bg-white border-b border-pt-neutral-200 shrink-0">
        <div className="flex flex-wrap gap-2.5 items-end">
          <FilterGroup label="Dealer">
            <DealerMultiSelect
              options={dealerOptions}
              selectedValues={draft.dealers}
              onToggle={toggleDealer}
              onClear={clearDealerSelection}
              onSelectAll={selectAllDealers}
            />
          </FilterGroup>

          <FilterGroup label="ลูกค้า / Line">
            <Input
              placeholder="ชื่อลูกค้า, Line ID..."
              className="h-9 text-[12px] w-52 rounded-[16px] border-pt-neutral-300 placeholder:text-pt-neutral-400 focus:border-pt-primary-500 focus:ring-0"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
              value={draft.searchCust}
              onChange={(e) => updateDraft("searchCust", e.target.value)}
            />
          </FilterGroup>

          <FilterGroup label="Site code">
            <Input
              placeholder="รหัส Site code"
              className="h-9 text-[12px] w-40 rounded-[16px] border-pt-neutral-300 placeholder:text-pt-neutral-400 focus:border-pt-primary-500 focus:ring-0"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
              value={draft.searchSite}
              onChange={(e) => updateDraft("searchSite", e.target.value)}
            />
          </FilterGroup>

          <FilterGroup label="วันเท">
            <Input
              type="date"
              className="h-9 text-[12px] w-40 rounded-[16px] border-pt-neutral-300 focus:border-pt-primary-500 focus:ring-0"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
              value={draft.pourDate}
              onChange={(e) => updateDraft("pourDate", e.target.value)}
            />
          </FilterGroup>

          <FilterGroup label="เวลาเท">
            <Input
              type="time"
              className="h-9 text-[12px] w-32 rounded-[16px] border-pt-neutral-300 focus:border-pt-primary-500 focus:ring-0"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
              value={draft.pourTime}
              onChange={(e) => updateDraft("pourTime", e.target.value)}
            />
          </FilterGroup>

          <FilterGroup label="สถานะงาน">
            <Select value={draft.status} onValueChange={(v) => updateDraft("status", v)}>
              <SelectTrigger
                className="h-9 text-[12px] w-44 rounded-[16px] border-pt-neutral-300"
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

          <div className="flex gap-2 self-end">
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

        {draft.dealers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {draft.dealers.map((dealerId) => {
              const dealer = dealerOptions.find((d) => d.value === dealerId);
              if (!dealer) return null;

              return (
                <span
                  key={dealerId}
                  className="inline-flex items-center gap-1 rounded-full bg-pt-primary-50 border border-pt-primary-200 text-pt-primary-700 px-3 py-1 text-[11px]"
                >
                  {dealer.label}
                  <button
                    type="button"
                    onClick={() => toggleDealer(dealerId)}
                    className="hover:text-pt-error-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-5">
        <div
          className="bg-white rounded-[24px] border border-pt-neutral-200 overflow-hidden"
          style={{ boxShadow: "var(--pt-shadow-sm)" }}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-pt-neutral-50 border-b border-pt-neutral-200">
            <p className="text-[12px] text-pt-neutral-500">
              แสดง <strong className="text-pt-neutral-900">{totalOrders}</strong> รายการ
              {flatRows.length > 0 && (
                <span className="ml-2 text-pt-neutral-400">
                  (หน้า {page} จาก {totalPages})
                </span>
              )}
            </p>
            <p className="text-[10px] text-pt-neutral-400">
              ▸ กด “ดูประวัติ” เพื่อเปิดรายละเอียดการจัดส่ง
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table className="table-fixed min-w-[1600px]">
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
                      key={`${row.dealerId}-${row.customer.id}-${row.site.siteCode}-${row.order.orderId}`}
                      row={row}
                      onOpenHistory={openHistory}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-32 text-center">
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
            <div className="flex items-center gap-4 px-4 py-3 border-t border-pt-neutral-200 bg-white">
              <p className="text-[11px] text-pt-neutral-400 shrink-0">
                หน้า <strong className="text-pt-neutral-700">{page}</strong> จาก{" "}
                <strong className="text-pt-neutral-700">{totalPages}</strong> · {flatRows.length} รายการทั้งหมด
              </p>

              <Pagination className="justify-end">
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

      <DeliveryHistoryDialog
        row={historyRow}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </div>
  );
}