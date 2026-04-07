"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CustomerGroup,
  DPStatusType,
  OrderDetail,
  OrderStatusType,
  SiteDetail,
} from "@/types/dashboard";

// ─── Style maps ────────────────────────────────────────────────────────────────

export const ORDER_STYLE: Record<
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

export const DP_STYLE: Record<DPStatusType, string> = {
  "DP ครบ": "bg-pt-success-100 text-pt-success-700 border-pt-success-300",
  "DP เปิดแล้ว": "bg-pt-primary-100 text-pt-primary-700 border-pt-primary-300",
  "รอเปิด DP": "bg-pt-warning-100 text-pt-warning-600 border-pt-warning-500",
  รอปริมาณรวม: "bg-pt-neutral-100 text-pt-neutral-600 border-pt-neutral-300",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export const sumDelivered = (o: OrderDetail) =>
  o.deliveries.reduce((sum, d) => sum + d.qty, 0);

export const progress = (sent: number, total: number) =>
  total > 0 ? Math.round((sent / total) * 100) : 0;

// ─── Sub-components ────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: OrderStatusType }) {
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

export function DPBadge({
  status,
  plant,
}: {
  status: DPStatusType;
  plant: string;
}) {
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

export function MiniProgress({
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

// ─── Dialog row type ──────────────────────────────────────────────────────────

export type DialogOrderRow = {
  customer: CustomerGroup;
  site: SiteDetail;
  order: OrderDetail;
  dealerId?: string;
  dealerName?: string;
};

// ─── Dialog component ─────────────────────────────────────────────────────────

type OrderDetailDialogProps = {
  row: DialogOrderRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderDetailDialog({
  row,
  open,
  onOpenChange,
}: OrderDetailDialogProps) {
  if (!row) return null;

  const sent = sumDelivered(row.order);
  const rem = Math.max(row.order.totalQty - sent, 0);
  const pct = progress(sent, row.order.totalQty);
  const statusStyle = ORDER_STYLE[row.order.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg sm:max-w-xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-[20px]">
        <DialogTitle className="sr-only">
          รายละเอียดคำสั่งจอง — {row.order.product}
        </DialogTitle>

        <div className="relative px-5 pt-5 pb-4 rounded-t-[20px] bg-gradient-to-br from-[#00BDF8] to-[#0090c8]">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-black/70 uppercase tracking-widest mb-1">
                รายละเอียดคำสั่งจอง
              </p>
              <h2 className="text-[18px] font-bold text-black leading-tight">
                {row.order.product}
              </h2>
              <p className="text-[12px] text-black/70 font-mono mt-0.5">
                {row.order.orderId}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusBadge status={row.order.status} />
              <DPBadge status={row.order.dpStatus} plant={row.order.dpPlant} />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-black/70">ความคืบหน้าการจัดส่ง</span>
              <span className="text-[11px] font-bold text-black">{pct}%</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-black/70">ส่งแล้ว {sent.toLocaleString()} คิว</span>
              <span className="text-[10px] text-black/70">คงเหลือ {rem.toLocaleString()} คิว</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
            {/* ลูกค้า */}
            <div className="rounded-[14px] border border-pt-neutral-100 bg-pt-neutral-50 p-3.5">
              <p className="text-[9px] font-bold text-pt-neutral-400 uppercase tracking-widest mb-2">
                ลูกค้า / ผู้ติดต่อ
              </p>
              <p className="text-[14px] font-bold text-pt-neutral-900 leading-tight">
                {row.customer.companyName}
              </p>
              <p className="text-[11px] text-pt-neutral-500 mt-0.5">{row.customer.id}</p>
              <div className="mt-2 pt-2 border-t border-pt-neutral-200 space-y-0.5">
                <p className="text-[11px] text-pt-neutral-700">
                  {row.order.contactPerson || row.customer.contactPerson || "—"}
                </p>
                <p className="text-[11px] text-pt-neutral-500 font-mono">
                  {row.order.contactPhone || row.customer.phone || "—"}
                </p>
                {row.customer.contactLine && (
                  <p className="text-[11px] text-pt-neutral-500">Line: {row.customer.contactLine}</p>
                )}
              </div>
            </div>

            {/* Dealer (company) หรือ Site (dealer view) */}
            <div className="rounded-[14px] border border-pt-neutral-100 bg-pt-neutral-50 p-3.5">
              {row.dealerId ? (
                <>
                  <p className="text-[9px] font-bold text-pt-neutral-400 uppercase tracking-widest mb-2">Dealer</p>
                  <p className="text-[14px] font-bold text-pt-neutral-900 leading-tight">{row.dealerName}</p>
                  <p className="text-[11px] text-pt-neutral-500 font-mono mt-0.5">{row.dealerId}</p>
                </>
              ) : (
                <>
                  <p className="text-[9px] font-bold text-pt-neutral-400 uppercase tracking-widest mb-2">Site</p>
                  <p className="text-[14px] font-bold text-pt-primary-700 font-mono leading-tight">{row.site.siteCode}</p>
                  <p className="text-[12px] text-pt-neutral-700 mt-0.5">{row.site.siteName}</p>
                  <p className="text-[11px] text-pt-neutral-500 mt-0.5">{row.site.location}</p>
                </>
              )}
            </div>
          </div>

          <div className="rounded-[14px] border border-pt-neutral-100 bg-white overflow-hidden">
            <div className="px-4 py-2.5 bg-pt-neutral-50 border-b border-pt-neutral-100">
              <p className="text-[10px] font-bold text-pt-neutral-500 uppercase tracking-widest">ข้อมูลคำสั่ง</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-pt-neutral-100">
              <div className="px-4 py-3 text-center border-b sm:border-b-0 border-r border-pt-neutral-100">
                <p className="text-[9px] text-pt-neutral-400 uppercase tracking-wider mb-1">ปริมาณสั่ง</p>
                <p className="text-[18px] font-bold text-pt-neutral-900 font-mono leading-none">
                  {row.order.totalQty.toLocaleString()}
                </p>
                <p className="text-[10px] text-pt-neutral-400 mt-0.5">คิว</p>
              </div>
              <div className="px-4 py-3 text-center border-b sm:border-b-0 sm:border-r border-pt-neutral-100">
                <p className="text-[9px] text-pt-neutral-400 uppercase tracking-wider mb-1">ส่งแล้ว</p>
                <p className="text-[18px] font-bold text-pt-primary-600 font-mono leading-none">
                  {sent.toLocaleString()}
                </p>
                <p className="text-[10px] text-pt-neutral-400 mt-0.5">คิว</p>
              </div>
              <div className="px-4 py-3 text-center border-r border-pt-neutral-100">
                <p className="text-[9px] text-pt-neutral-400 uppercase tracking-wider mb-1">คงเหลือ</p>
                <p className={`text-[18px] font-bold font-mono leading-none ${rem === 0 ? "text-pt-success-600" : "text-pt-neutral-900"}`}>
                  {rem.toLocaleString()}
                </p>
                <p className="text-[10px] text-pt-neutral-400 mt-0.5">คิว</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-[9px] text-pt-neutral-400 uppercase tracking-wider mb-1">วัน/เวลาเท</p>
                <p className="text-[13px] font-bold text-pt-neutral-900 leading-tight">
                  {row.order.schedDate || "—"}
                </p>
                <p className="text-[11px] text-pt-neutral-500 font-mono">{row.order.schedTime || "—"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-pt-neutral-100 bg-white p-3.5">
              <p className="text-[9px] font-bold text-pt-neutral-400 uppercase tracking-widest mb-2">
                {row.dealerId ? "Site / Plant" : "Plant / DP"}
              </p>
              <div className="space-y-1.5 text-[12px]">
                {row.dealerId && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-pt-neutral-500">Site code</span>
                      <span className="font-mono font-semibold text-pt-primary-700">{row.site.siteCode}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-pt-neutral-500 shrink-0">Site name</span>
                      <span className="font-medium text-pt-neutral-800 text-right">{row.site.siteName}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-pt-neutral-500 shrink-0">Location</span>
                      <span className="text-pt-neutral-700 text-right">{row.site.location || "—"}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-pt-neutral-500">Plant / DP</span>
                  <span className="font-medium text-pt-neutral-800">{row.order.dpPlant || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-pt-neutral-500">Dispatch</span>
                  <span className="font-mono text-pt-neutral-700">{row.order.dispatchCode || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-pt-neutral-500">Truck</span>
                  <span className="text-pt-neutral-700">{row.order.truck || "—"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[14px] border border-pt-neutral-100 bg-white p-3.5">
              <p className="text-[9px] font-bold text-pt-neutral-400 uppercase tracking-widest mb-2">หมายเหตุ</p>
              <div className="space-y-1.5 text-[12px]">
                <div>
                  <span className="text-pt-neutral-400 text-[10px] uppercase tracking-wide">Memo</span>
                  <p className="text-pt-neutral-700 mt-0.5">{row.order.memo || "—"}</p>
                </div>
                <div>
                  <span className="text-pt-neutral-400 text-[10px] uppercase tracking-wide">Internal note</span>
                  <p className="text-pt-neutral-700 mt-0.5">{row.order.internalNote || "—"}</p>
                </div>
                <div className="flex justify-between pt-1 border-t border-pt-neutral-100">
                  <span className="text-pt-neutral-400">Status raw</span>
                  <span className="font-mono text-[11px] text-pt-neutral-600 bg-pt-neutral-50 px-2 py-0.5 rounded-md">
                    {String(row.order.currentStatusRaw ?? "—")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── ประวัติการจัดส่ง ─────────────────────────────────────── */}
          <div className="rounded-[14px] border border-pt-neutral-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-pt-neutral-50 border-b border-pt-neutral-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-pt-neutral-500 uppercase tracking-widest">
                ประวัติการจัดส่ง
              </p>
              <span className="text-[11px] text-pt-neutral-500 bg-white border border-pt-neutral-200 rounded-full px-2 py-0.5">
                {row.order.deliveries.length} รอบ
              </span>
            </div>

            <div className="max-h-[280px] overflow-auto">
              {row.order.deliveries.length > 0 ? (
                <div className="divide-y divide-pt-neutral-50">
                  {row.order.deliveries.map((d, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-4 hover:bg-pt-neutral-50">
                      <div className="w-20 shrink-0">
                        <p className="text-[11px] font-mono font-semibold text-pt-neutral-900">{d.date}</p>
                        <p className="text-[10px] font-mono text-pt-neutral-500">{d.time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-pt-neutral-700 truncate">{d.note || "—"}</p>
                        <p className="text-[10px] text-pt-neutral-400 mt-0.5">{d.truck}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[14px] font-bold text-pt-primary-600 font-mono">
                          {d.qty.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-pt-neutral-400">คิว</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-2xl mb-2">📦</p>
                  <p className="text-[13px] text-pt-neutral-500">ยังไม่มีประวัติการจัดส่ง</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}