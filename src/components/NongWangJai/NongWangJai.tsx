"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BotMessageSquare, Download } from "lucide-react";

import {
  NongWangJaiMessage,
  InboxSummary,
} from "@/types/NongWangJai";
import {
  NongWangJaiService,
  getConfidenceColor,
  getStatusStyle,
  getOrderStatusDot,
} from "@/services/NongWangJai";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPaginationRange(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

function getConfidenceLabel(confidence: number) {
  if (confidence >= 70) return "สูง";
  if (confidence >= 50) return "กลาง";
  return "ต่ำ";
}

// ─── UI Atoms ─────────────────────────────────────────────────────────────────

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
        <span className="text-[11px] text-pt-neutral-500 font-medium">
          {sub}
        </span>
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

function ConfidenceBar({ confidence }: { confidence: number }) {
  const conf = getConfidenceColor(confidence);

  return (
    <div className="min-w-[130px]">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-pt-neutral-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`${conf.bar} h-full rounded-full transition-all`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span className={`text-[11px] font-bold w-9 text-right ${conf.text}`}>
          {confidence}%
        </span>
      </div>
      <p className="text-[10px] text-pt-neutral-500 mt-0.5 text-right">
        {getConfidenceLabel(confidence)}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: NongWangJaiMessage["status"] }) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-bold gap-1.5 rounded-[8px] uppercase tracking-wide ${getStatusStyle(
        status,
      )}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          status === "รอแอดมิน"
            ? "bg-pt-error-500"
            : status === "AI ดูแลอยู่"
              ? "bg-pt-success-500"
              : "bg-pt-neutral-400"
        }`}
      />
      {status}
    </Badge>
  );
}

function OrderStatusChip({
  orderStatus,
  orderId,
}: {
  orderStatus: string;
  orderId: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-1 bg-pt-neutral-100 border border-pt-neutral-200 text-pt-neutral-600 text-[11px] font-medium rounded-full px-2.5 py-0.5 w-fit">
        <span
          className={`w-1.5 h-1.5 rounded-full ${getOrderStatusDot(orderStatus)}`}
        />
        {orderStatus}
      </span>
      <span className="text-[10px] text-pt-neutral-400 font-mono pl-0.5">
        {orderId}
      </span>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function InboxRow({ item }: { item: NongWangJaiMessage }) {
  return (
    <TableRow className="hover:bg-pt-neutral-50 transition-colors border-b border-pt-neutral-200 align-top">
      {/* เวลา */}
      <TableCell className="w-[78px]">
        <span className="font-mono text-[12px] font-medium text-pt-neutral-700 flex items-center gap-1">
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              item.status === "รอแอดมิน"
                ? "bg-pt-error-500 animate-pulse"
                : "bg-pt-success-500"
            }`}
          />
          {item.timestamp}
        </span>
      </TableCell>

      {/* ลูกค้า */}
      <TableCell className="w-[220px] min-w-[220px]">
        <p className="font-semibold text-[13px] text-pt-neutral-900 leading-tight">
          {item.customerName}
        </p>
        <p className="text-[11px] text-pt-neutral-500 mt-0.5">
          {item.customerId} · LINE: {item.contactLine}
        </p>
        <p className="text-[10px] text-pt-neutral-400 mt-0.5">{item.phone}</p>
      </TableCell>

      {/* Site */}
      <TableCell className="w-[180px] min-w-[180px]">
        <div
          className="inline-flex items-center gap-1.5 font-mono font-semibold text-[12px] px-2.5 py-1 rounded-[12px] bg-pt-primary-600 text-white"
          style={{ boxShadow: "var(--pt-shadow-xs)" }}
        >
          {item.siteCode}
        </div>
        <p className="text-[11px] text-pt-neutral-500 mt-1 leading-tight">
          {item.siteName}
        </p>
      </TableCell>

      {/* ข้อความลูกค้า */}
      <TableCell className="w-[280px] min-w-[280px]">
        <div className="bg-pt-neutral-50 border border-pt-neutral-200 rounded-[12px] px-3 py-2.5">
          <p className="text-[12px] text-pt-neutral-800 leading-relaxed line-clamp-3">
            “{item.userMessage}”
          </p>
        </div>
      </TableCell>

      {/* AI Reply */}
      <TableCell className="w-[280px] min-w-[280px]">
        <div className="bg-pt-primary-50 border border-pt-primary-100 rounded-[12px] px-3 py-2.5">
          <p className="text-[10px] font-semibold text-pt-primary-500 mb-1 flex items-center gap-1">
            <BotMessageSquare size={11} />
            AI ตอบกลับ
          </p>
          <p className="text-[12px] text-pt-neutral-700 leading-relaxed line-clamp-3">
            “{item.aiReply}”
          </p>
        </div>
      </TableCell>

      {/* Confidence */}
      <TableCell className="w-[140px]">
        <ConfidenceBar confidence={item.confidence} />
      </TableCell>

      {/* รอ */}
      <TableCell className="text-right w-[90px]">
        <span
          className={`font-mono font-semibold text-[13px] ${
            item.waitMinutes >= 15 ? "text-pt-error-600" : "text-pt-neutral-900"
          }`}
        >
          {item.waitMinutes}
        </span>
        <p className="text-[10px] text-pt-neutral-500">นาที</p>
      </TableCell>

      {/* สถานะ */}
      <TableCell className="w-[135px]">
        <StatusBadge status={item.status} />
      </TableCell>

      {/* Order/สินค้า */}
      <TableCell className="w-[220px] min-w-[220px]">
        <OrderStatusChip orderStatus={item.orderStatus} orderId={item.orderId} />
        <p className="text-[11px] text-pt-neutral-700 mt-1">{item.product}</p>
        <p className="text-[10px] text-pt-neutral-500">
          {item.qty} คิว · {item.dpPlant}
        </p>
      </TableCell>
    </TableRow>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function NongWangJai() {
  const allMessages = useMemo(() => NongWangJaiService.getMessages(), []);
  const summary: InboxSummary = useMemo(
    () => NongWangJaiService.getSummary(allMessages),
    [allMessages],
  );

  const [searchText, setSearchText] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confidenceFilter, setConfidenceFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return allMessages.filter((item) => {
      const textMatch =
        !searchText ||
        [
          item.customerName,
          item.customerId,
          item.contactLine,
          item.phone,
          item.userMessage,
          item.aiReply,
          item.orderId,
          item.product,
        ].some((v) => v.toLowerCase().includes(searchText.toLowerCase()));

      const siteMatch =
        !siteFilter ||
        [item.siteCode, item.siteName].some((v) =>
          v.toLowerCase().includes(siteFilter.toLowerCase()),
        );

      const statusMatch =
        statusFilter === "ALL" || item.status === statusFilter;

      const confidenceMatch =
        confidenceFilter === "ALL" ||
        (confidenceFilter === "LOW" && item.confidence < 50) ||
        (confidenceFilter === "MEDIUM" &&
          item.confidence >= 50 &&
          item.confidence < 70) ||
        (confidenceFilter === "HIGH" && item.confidence >= 70);

      return textMatch && siteMatch && statusMatch && confidenceMatch;
    });
  }, [allMessages, searchText, siteFilter, statusFilter, confidenceFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchText, siteFilter, statusFilter, confidenceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearchText("");
    setSiteFilter("");
    setStatusFilter("ALL");
    setConfidenceFilter("ALL");
  };

const formatThaiDateTime = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear() + 543} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const [dateStr, setDateStr] = useState(formatThaiDateTime(new Date()));

useEffect(() => {
  const timer = setInterval(() => {
    setDateStr(formatThaiDateTime(new Date()));
  }, 1000);

  return () => clearInterval(timer);
}, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── Header ── */}
      <div
        className="px-6 pt-5 pb-4 bg-white border-b border-pt-neutral-200 shrink-0"
        style={{ boxShadow: "var(--pt-shadow-sm)" }}
      >
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-pt-neutral-900 leading-tight">
              AI Nong Wang Jai — กล่องรอแอดมิน
            </h1>
            <p className="text-[12px] text-pt-neutral-500 mt-0.5">
              ลูกค้าที่ AI ส่งต่อให้แอดมินดูแล · อัปเดต {dateStr}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-[12px] rounded-[16px] bg-white border-pt-neutral-200 text-pt-neutral-700
                       hover:bg-pt-primary-50 hover:border-pt-primary-300 hover:text-pt-primary-600 transition-colors"
            style={{ boxShadow: "var(--pt-shadow-xs)" }}
          >
            <Download size={14} /> Export Excel
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="รอแอดมินตอบ"
            value={String(summary.waitingCount)}
            sub="รายการ"
            accentClass="border-l-pt-error-600"
          />
          <StatCard
            label="Confidence ต่ำ"
            value={String(summary.lowConfidenceCount)}
            sub="รายการ"
            accentClass="border-l-pt-warning-500"
          />
          <StatCard
            label="AI ดูแลอยู่"
            value={String(summary.aiHandlingCount)}
            sub="รายการ"
            accentClass="border-l-pt-success-600"
          />
          <StatCard
            label="เฉลี่ยเวลารอ"
            value={String(summary.avgWaitMinutes)}
            sub="นาที"
            accentClass="border-l-pt-neutral-700"
          />
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="px-6 py-3 bg-white border-b border-pt-neutral-200 shrink-0">
        <div className="flex flex-wrap gap-2.5 items-end">
          <FilterGroup label="ลูกค้า / LINE / ข้อความ">
            <Input
              placeholder="ชื่อลูกค้า, LINE, ข้อความ..."
              className="h-9 text-[12px] w-64 rounded-[16px] border-pt-neutral-300 placeholder:text-pt-neutral-400
                         focus:border-pt-primary-500 focus:ring-0"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </FilterGroup>

          <FilterGroup label="Site code">
            <Input
              placeholder="รหัส Site code"
              className="h-9 text-[12px] w-40 rounded-[16px] border-pt-neutral-300 placeholder:text-pt-neutral-400
                         focus:border-pt-primary-500 focus:ring-0"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
            />
          </FilterGroup>

          <FilterGroup label="สถานะกล่องงาน">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="h-9 text-[12px] w-44 rounded-[16px] border-pt-neutral-300"
                style={{ boxShadow: "var(--pt-shadow-xs)" }}
              >
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">สถานะทั้งหมด</SelectItem>
                <SelectItem value="รอแอดมิน">รอแอดมิน</SelectItem>
                <SelectItem value="AI ดูแลอยู่">AI ดูแลอยู่</SelectItem>
                <SelectItem value="ตอบแล้ว">ตอบแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </FilterGroup>

          <FilterGroup label="Confidence">
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger
                className="h-9 text-[12px] w-40 rounded-[16px] border-pt-neutral-300"
                style={{ boxShadow: "var(--pt-shadow-xs)" }}
              >
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="LOW">ต่ำ (&lt;50%)</SelectItem>
                <SelectItem value="MEDIUM">กลาง (50–69%)</SelectItem>
                <SelectItem value="HIGH">สูง (≥70%)</SelectItem>
              </SelectContent>
            </Select>
          </FilterGroup>

          <div className="flex gap-2 self-end">
            <Button
              size="sm"
              className="h-9 px-5 rounded-[16px] text-[12px] font-semibold bg-pt-neutral-900 text-white
                         hover:bg-pt-neutral-800 transition-colors"
              style={{ boxShadow: "var(--pt-shadow-xs)" }}
            >
              ค้นหา
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-3 rounded-[16px] text-[12px] text-pt-neutral-500
                         hover:bg-pt-neutral-100 hover:text-pt-neutral-700 transition-colors"
              onClick={resetFilters}
            >
              ล้างตัวกรอง
            </Button>
          </div>
        </div>
      </div>

      {/* ── Table area ── */}
      <div className="flex-1 overflow-auto p-5">
        <div
          className="bg-white rounded-[24px] border border-pt-neutral-200 overflow-hidden"
          style={{ boxShadow: "var(--pt-shadow-sm)" }}
        >
          {/* Info bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-pt-neutral-50 border-b border-pt-neutral-200">
            <p className="text-[12px] text-pt-neutral-500">
              แสดง{" "}
              <strong className="text-pt-neutral-900">{filtered.length}</strong>{" "}
              รายการ
              {filtered.length > 0 && (
                <span className="ml-2 text-pt-neutral-400">
                  (หน้า {page} จาก {totalPages})
                </span>
              )}
            </p>
            <p className="text-[10px] text-pt-neutral-400">
              ▸ ดูข้อความลูกค้า, AI reply และ confidence ในตารางเดียว
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table className="table-fixed min-w-[1650px]">
              <TableHeader>
                <TableRow className="bg-pt-neutral-100 hover:bg-pt-neutral-100 border-b-2 border-pt-neutral-200">
                  <TableHead className="w-[70px] text-[10px] font-bold text-pt-neutral-600 uppercase tracking-wider h-9 sticky top-0 bg-pt-neutral-100 z-10">
                    เวลา
                  </TableHead>
                  <TableHead className="w-[220px] text-[10px] font-bold text-pt-neutral-600 uppercase tracking-wider h-9 sticky top-0 bg-pt-neutral-100 z-10">
                    ลูกค้า
                  </TableHead>
                  <TableHead className="w-[180px] text-[10px] font-bold text-pt-neutral-600 uppercase tracking-wider h-9 sticky top-0 bg-pt-neutral-100 z-10">
                    Site code
                  </TableHead>
                  <TableHead className="w-[280px] text-[10px] font-bold text-pt-neutral-600 uppercase tracking-wider h-9 sticky top-0 bg-pt-neutral-100 z-10">
                    ข้อความลูกค้า
                  </TableHead>
                  <TableHead className="w-[280px] text-[10px] font-bold text-pt-neutral-600 uppercase tracking-wider h-9 sticky top-0 bg-pt-neutral-100 z-10">
                    AI ตอบกลับ
                  </TableHead>
                  <TableHead className="w-[140px] text-[10px] font-bold text-pt-neutral-600 uppercase tracking-wider h-9 sticky top-0 bg-pt-neutral-100 z-10">
                    Confidence
                  </TableHead>
                  <TableHead className="w-[90px] text-[10px] font-bold text-pt-neutral-600 uppercase tracking-wider h-9 sticky top-0 bg-pt-neutral-100 z-10 text-right">
                    รอ (นาที)
                  </TableHead>
                  <TableHead className="w-[135px] text-[10px] font-bold text-pt-neutral-600 uppercase tracking-wider h-9 sticky top-0 bg-pt-neutral-100 z-10">
                    สถานะ
                  </TableHead>
                  <TableHead className="w-[220px] text-[10px] font-bold text-pt-neutral-600 uppercase tracking-wider h-9 sticky top-0 bg-pt-neutral-100 z-10">
                    Order / สินค้า
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.length > 0 ? (
                  paginated.map((item) => (
                    <InboxRow key={item.id} item={item} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
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

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-3 border-t border-pt-neutral-200 bg-white">
              <p className="text-[11px] text-pt-neutral-400 shrink-0">
                หน้า <strong className="text-pt-neutral-700">{page}</strong> จาก{" "}
                <strong className="text-pt-neutral-700">{totalPages}</strong> ·{" "}
                {filtered.length} รายการทั้งหมด
              </p>

              <Pagination className="justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={
                        page === 1
                          ? "pointer-events-none opacity-40"
                          : "cursor-pointer"
                      }
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        page === totalPages
                          ? "pointer-events-none opacity-40"
                          : "cursor-pointer"
                      }
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