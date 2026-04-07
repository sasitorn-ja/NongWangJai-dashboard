// ─── Union Types ──────────────────────────────────────────────────────────────

export type InboxStatus =
  | "รอแอดมิน"    // AI ส่งต่อ รอคนดูแล
  | "AI ดูแลอยู่" // AI กำลังจัดการอยู่
  | "ตอบแล้ว"     // ปิดแล้ว

export type ConfidenceLevel = "high" | "medium" | "low"

export type InboxFilterTab = "รอแอดมิน" | "confidence_low" | "ทั้งหมด"

// ─── Data Shape (มาจาก DB / AI pipeline ใน LINE) ─────────────────────────────

export interface NongWangJaiMessage {
  id: string
  customerId: string
  customerName: string
  contactLine: string
  phone: string
  siteCode: string
  siteName: string
  /** ข้อความที่ลูกค้าส่งมาใน LINE */
  userMessage: string
  /** คำตอบที่ AI draft ไว้ก่อนส่งต่อ */
  aiReply: string
  /** 0–100 */
  confidence: number
  /** นาทีที่รอตั้งแต่ AI ส่งต่อ */
  waitMinutes: number
  status: InboxStatus
  orderId: string
  product: string
  qty: number
  dpPlant: string
  orderStatus: string
  /** "HH:mm" */
  timestamp: string
}

// ─── View Model ───────────────────────────────────────────────────────────────

export interface InboxSummary {
  waitingCount: number
  lowConfidenceCount: number
  aiHandlingCount: number
  avgWaitMinutes: number
}