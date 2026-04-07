import {
  NongWangJaiMessage,
  InboxSummary,
  InboxFilterTab,
  ConfidenceLevel,
} from "@/types/NongWangJai"

// ─── Pure Helpers (exported สำหรับใช้ใน component) ───────────────────────────

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 70) return "high"
  if (confidence >= 50) return "medium"
  return "low"
}

export function getConfidenceColor(confidence: number) {
  const level = getConfidenceLevel(confidence)
  if (level === "high")   return { bar: "bg-pt-success-500", text: "text-pt-success-700" }
  if (level === "medium") return { bar: "bg-pt-warning-500", text: "text-pt-warning-600" }
  return                         { bar: "bg-pt-error-500",   text: "text-pt-error-600"   }
}

export function getStatusStyle(status: NongWangJaiMessage["status"]) {
  if (status === "รอแอดมิน")    return "bg-pt-error-100 text-pt-error-700 border-pt-error-200"
  if (status === "AI ดูแลอยู่") return "bg-pt-success-100 text-pt-success-700 border-pt-success-300"
  return "bg-pt-neutral-100 text-pt-neutral-600 border-pt-neutral-300"
}

export function getOrderStatusDot(status: string) {
  if (status === "อยู่ระหว่างจัดส่ง") return "bg-pt-primary-500 animate-pulse"
  if (status === "ดำเนินการครบถ้วน")  return "bg-pt-success-500"
  if (status === "รอ Site code")       return "bg-pt-neutral-400"
  return "bg-pt-warning-500"
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
// TODO: แทนที่ด้วย API call จริงเมื่อ backend พร้อม
// เช่น: const res = await fetch("/api/nong-wang-jai/inbox")

const MOCK_MESSAGES: NongWangJaiMessage[] = [
  {
    id: "msg-001",
    customerId: "C004501",
    customerName: "คุณอนุชา โฮมบิลด์",
    contactLine: "@anucha_home",
    phone: "092-999-8888",
    siteCode: "K00088",
    siteName: "บ้านอนุชา ซ.10",
    userMessage: "วัดดูแล้ว น่าจะประมาณ 2.5 เมตรครับ รถเข้าได้ไหม แล้วต้องสั่งปริมาณเท่าไหรครับ",
    aiReply: "ความกว้าง 2.5 เมตร รถเล็กสามารถเข้าได้ครับ ขอทราบปริมาณที่ต้องการเพื่อคำนวณเที่ยวรถครับ",
    confidence: 45,
    waitMinutes: 18,
    status: "รอแอดมิน",
    orderId: "OD-2026-0421",
    product: "คอนกรีต 180 KSC",
    qty: 9,
    dpPlant: "DP1",
    orderStatus: "รอ Site code",
    timestamp: "13:30",
  },
  
]

// ─── Service (read-only) ──────────────────────────────────────────────────────

export const NongWangJaiService = {
  /** ดึงรายการทั้งหมด (read-only จาก DB / AI pipeline) */
  getMessages: (): NongWangJaiMessage[] => MOCK_MESSAGES,

  /** คำนวณ summary stats สำหรับ header cards */
  getSummary: (messages: NongWangJaiMessage[]): InboxSummary => ({
    waitingCount:       messages.filter((m) => m.status === "รอแอดมิน").length,
    lowConfidenceCount: messages.filter((m) => getConfidenceLevel(m.confidence) === "low").length,
    aiHandlingCount:    messages.filter((m) => m.status === "AI ดูแลอยู่").length,
    avgWaitMinutes:
      messages.length > 0
        ? Math.round(messages.reduce((s, m) => s + m.waitMinutes, 0) / messages.length)
        : 0,
  }),

  /** Filter ตาม tab ที่เลือก */
  filterByTab: (messages: NongWangJaiMessage[], tab: InboxFilterTab): NongWangJaiMessage[] => {
    if (tab === "รอแอดมิน")       return messages.filter((m) => m.status === "รอแอดมิน")
    if (tab === "confidence_low") return messages.filter((m) => getConfidenceLevel(m.confidence) === "low")
    return messages
  },
}