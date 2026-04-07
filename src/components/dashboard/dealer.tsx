"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DashboardService } from "@/services/dashboard";
import {
  CustomerGroup,
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
import { ChevronDown, ChevronRight, Download, History } from "lucide-react";

const PAGE_SIZE = 10;

const HEADERS = [
  ["เวลา Update", "w-[70px]"],
  ["ลูกค้า / ผู้รับเหมา", "w-[220px]"],
  ["Site code", "w-[170px]"],
  ["รายการสั่งคอนกรีต", "w-[200px]"],
  ["ปริมาณสั่ง (คิว)", "w-[90px] text-right"],
  ["ส่งแล้ว (คิว)", "w-[100px] text-right"],
  ["คงเหลือ (คิว)", "w-[90px] text-right"],
  ["วัน/เวลาเท", "w-[110px] text-center"],
  ["สถานะคำสั่ง", "w-[140px]"],
  ["สถานะ DP", "w-[120px]"],
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
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
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

function DeliveryHistory({ order }: { order: OrderDetail }) {
  const sent = sumDelivered(order);
  const rem = Math.max(order.totalQty - sent, 0);

  return (
    <div className="px-4 py-3 bg-pt-neutral-100 border-t border-pt-neutral-200">
      <p className="text-[10px] font-bold text-pt-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <History size={10} /> ประวัติการจัดส่ง · {order.orderId} · {order.product}
      </p>

      <div className="space-y-1.5">
        {order.deliveries.map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-[12px] bg-white border border-pt-neutral-200 rounded-[8px] px-3 py-2"
            style={{ boxShadow: "var(--pt-shadow-xs)" }}
          >
            <span className="font-mono font-medium text-pt-neutral-900 w-24 shrink-0">
              {d.date}
            </span>
            <span className="font-mono text-pt-neutral-500 w-10 shrink-0">
              {d.time}
            </span>
            <span className="text-pt-neutral-700 flex-1">{d.note}</span>
            <span className="text-pt-neutral-500 text-[11px] w-16 text-right shrink-0">
              {d.truck}
            </span>
            <span className="font-semibold font-mono text-pt-primary-600 w-16 text-right shrink-0">
              {d.qty.toLocaleString()} คิว
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-2.5 pt-2 border-t border-pt-neutral-200 text-[11px] justify-end text-pt-neutral-500">
        <span>
          ส่งแล้ว{" "}
          <strong className="text-pt-primary-600 font-mono">
            {sent.toLocaleString()}
          </strong>{" "}
          คิว
        </span>
        <span>
          คงเหลือ{" "}
          <strong
            className={`font-mono ${rem === 0 ? "text-pt-success-600" : "text-pt-warning-600"}`}
          >
            {rem.toLocaleString()}
          </strong>{" "}
          คิว
        </span>
        <span>
          ความคืบหน้า{" "}
          <strong className="font-mono text-pt-neutral-900">
            {progress(sent, order.totalQty)}%
          </strong>
        </span>
      </div>
    </div>
  );
}

function OrderRow({
  order,
  site,
  custName,
  custLine,
  showCustomer,
}: {
  order: OrderDetail;
  site: SiteDetail;
  custName: string;
  custLine: string;
  showCustomer: boolean;
}) {
  const [open, setOpen] = useState(false);
  const sent = sumDelivered(order);
  const rem = Math.max(order.totalQty - sent, 0);

  return (
    <>
      <TableRow className="hover:bg-pt-neutral-50 transition-colors border-b border-pt-neutral-200">
        <TableCell className="w-[78px]">
          {order.updateTime && order.updateTime !== "-" ? (
            <span className="font-mono text-[12px] font-medium text-pt-neutral-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-pt-success-500 animate-pulse shrink-0" />
              {order.updateTime}
            </span>
          ) : (
            <span className="text-pt-neutral-400 text-[11px]">—</span>
          )}
        </TableCell>

        <TableCell className="w-[240px] min-w-[240px] align-top overflow-hidden">
          {showCustomer ? (
            <>
              <p className="font-semibold text-[13px] text-pt-neutral-900 leading-tight">
                {custName}
              </p>
              <p className="text-[11px] text-pt-neutral-500 mt-0.5">Line: {custLine}</p>
            </>
          ) : (
            <div className="h-[34px]" />
          )}
        </TableCell>

        <TableCell className="w-[190px] min-w-[190px] overflow-hidden">
          <button
            onClick={() => order.deliveries.length > 0 && setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 font-mono font-semibold text-[12px] px-2.5 py-1 rounded-[12px] bg-pt-primary-600 text-white hover:bg-pt-primary-700"
            style={{ boxShadow: "var(--pt-shadow-xs)" }}
          >
            {site.siteCode}
            {order.deliveries.length > 0 &&
              (open ? <ChevronDown size={11} /> : <ChevronRight size={11} />)}
          </button>

          <p className="text-[11px] text-pt-neutral-500 mt-1 leading-tight">{site.siteName}</p>
          <p className="text-[10px] text-pt-neutral-400">📍 {site.location}</p>

          {order.deliveries.length > 0 && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-[10px] text-pt-primary-600 hover:text-pt-primary-700 hover:underline mt-0.5 font-medium"
            >
              {open ? "▾ ซ่อนประวัติ" : `▸ ดูประวัติ ${order.deliveries.length} รอบ`}
            </button>
          )}
        </TableCell>

        <TableCell className="w-[190px]">
          <p className="font-semibold text-[12px] text-pt-neutral-700">{order.product}</p>
          <p className="text-[11px] text-pt-neutral-500 leading-tight">{order.spec}</p>
          <p className="text-[10px] font-mono text-pt-neutral-400 mt-0.5">{order.orderId}</p>
        </TableCell>

        <TableCell className="text-right w-[85px]">
          <span className="font-mono font-semibold text-[13px] text-pt-neutral-700">
            {order.totalQty.toLocaleString()}
          </span>
          <p className="text-[10px] text-pt-neutral-500">คิว</p>
        </TableCell>

        <TableCell className="text-right w-[90px]">
          <span
            className={`font-mono font-semibold text-[13px] ${
              sent > 0 ? "text-pt-primary-600" : "text-pt-neutral-400"
            }`}
          >
            {sent.toLocaleString()}
          </span>
          <MiniProgress sent={sent} total={order.totalQty} status={order.status} />
        </TableCell>

        <TableCell className="text-right w-[85px]">
          <span
            className={`font-mono font-semibold text-[13px] ${
              rem === 0
                ? "text-pt-success-600"
                : order.status === "ยกเลิกรายการ"
                  ? "text-pt-neutral-400 line-through"
                  : "text-pt-neutral-900"
            }`}
          >
            {rem.toLocaleString()}
          </span>
          <p className="text-[10px] text-pt-neutral-500">คิว</p>
        </TableCell>

        <TableCell className="text-center w-[105px]">
          <p className="text-[12px] font-medium text-pt-neutral-700">
            {order.schedDate || "—"}
          </p>
          {!!order.schedTime && (
            <p className="text-[11px] font-mono text-pt-neutral-500">{order.schedTime}</p>
          )}
          {!!order.truck && order.truck !== "-" && (
            <p className="text-[11px] text-pt-neutral-500 mt-0.5">🚛 {order.truck}</p>
          )}
        </TableCell>

        <TableCell className="w-[145px]">
          <StatusBadge status={order.status} />
        </TableCell>

        <TableCell className="w-[130px]">
          <DPBadge status={order.dpStatus} plant={order.dpPlant} />
        </TableCell>
      </TableRow>

      {open && order.deliveries.length > 0 && (
        <TableRow>
          <TableCell colSpan={10} className="p-0">
            <DeliveryHistory order={order} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function CustomerGroupRows({ customer }: { customer: CustomerGroup }) {
  const [open, setOpen] = useState(false);
  const allOrders = customer.sites.flatMap((s) => s.orders);
  const totalSent = allOrders.reduce((sum, o) => sum + sumDelivered(o), 0);

  return (
    <>
      <TableRow
        className={`cursor-pointer select-none transition-colors border-t-2 ${
          open
            ? "bg-pt-primary-50 border-pt-primary-300"
            : "bg-pt-neutral-50 border-pt-neutral-200 hover:bg-pt-neutral-100"
        }`}
        onClick={() => setOpen((v) => !v)}
      >
        <TableCell colSpan={10} className="py-2.5 px-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`w-5 h-5 rounded-[8px] flex items-center justify-center shrink-0 ${
                open ? "bg-pt-primary-600 text-white" : "bg-pt-neutral-200 text-pt-neutral-500"
              }`}
            >
              {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>

            <div className="flex-1 min-w-0">
              <span className="font-bold text-[13px] text-pt-neutral-900">
                {customer.companyName}
              </span>
              <span className="text-[11px] text-pt-neutral-500 ml-2">
                {customer.id} · {customer.phone} · Line: {customer.contactLine}
              </span>
            </div>

            <Badge
              variant="outline"
              className="text-[10px] rounded-[8px] bg-white border-pt-neutral-300 text-pt-neutral-600"
            >
              {customer.sites.length} Site · {allOrders.length} Order
            </Badge>

            <Badge
              variant="outline"
              className="text-[10px] rounded-[8px] bg-pt-success-100 border-pt-success-300 text-pt-success-700"
            >
              ส่งแล้ว {totalSent.toLocaleString()} คิว
            </Badge>

            <span className="text-[10px] text-pt-neutral-500">{open ? "▲ ย่อ" : "▼ ขยาย"}</span>
          </div>
        </TableCell>
      </TableRow>

      {open &&
        customer.sites.flatMap((site, siteIndex) =>
          site.orders.map((order, orderIndex) => (
            <OrderRow
              key={`${site.siteCode}-${order.orderId}`}
              order={order}
              site={site}
              custName={customer.companyName}
              custLine={customer.contactLine}
              showCustomer={siteIndex === 0 && orderIndex === 0}
            />
          )),
        )}
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

  useEffect(() => {
    setPage(1);
  }, [filters, dealerId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allOrders = filtered.flatMap((c) => c.sites.flatMap((s) => s.orders));
  const totalOrders = allOrders.length;
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

  return (
    <div className="flex flex-col h-screen bg-background">
      <div
        className="px-6 pt-5 pb-4 bg-white border-b border-pt-neutral-200 shrink-0"
        style={{ boxShadow: "var(--pt-shadow-sm)" }}
      >
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-pt-neutral-900 leading-tight">
              ติดตามคำสั่งจอง EBooking — งานจองคอนกรีต
            </h1>
            <p className="text-[12px] text-pt-neutral-500 mt-0.5">
              Dealer: <span className="font-semibold text-pt-neutral-900">{dealerName}</span>
              <span className="ml-2 text-pt-neutral-400">({dealerId})</span>
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
            accentClass="border-l-pt-error-600"
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
            accentClass="border-l-pt-neutral-700"
          />
        </div>
      </div>

      <div className="px-6 py-3 bg-white border-b border-pt-neutral-200 shrink-0">
        <div className="flex flex-wrap gap-2.5 items-end">
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
      </div>

      <div className="flex-1 overflow-auto p-5">
        <div
          className="bg-white rounded-[24px] border border-pt-neutral-200 overflow-hidden"
          style={{ boxShadow: "var(--pt-shadow-sm)" }}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-pt-neutral-50 border-b border-pt-neutral-200">
            <p className="text-[12px] text-pt-neutral-500">
              แสดง <strong className="text-pt-neutral-900">{totalOrders}</strong> รายการ
              {filtered.length > 0 && (
                <span className="ml-2 text-pt-neutral-400">
                  (หน้า {page} จาก {totalPages})
                </span>
              )}
            </p>
            <p className="text-[10px] text-pt-neutral-400">
              ▸ คลิก Site chip เพื่อดูประวัติการจัดส่ง
            </p>
          </div>

          <div className="w-full overflow-x-hidden">
            <Table className="w-full table-fixed">
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
                  paginated.map((customer) => (
                    <CustomerGroupRows key={customer.id} customer={customer} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center">
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

          {filtered.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-3 border-t border-pt-neutral-200 bg-white">
              <p className="text-[11px] text-pt-neutral-400 shrink-0">
                หน้า <strong className="text-pt-neutral-700">{page}</strong> จาก{" "}
                <strong className="text-pt-neutral-700">{totalPages}</strong> · {filtered.length} ลูกค้าทั้งหมด
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
    </div>
  );
}