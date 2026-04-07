import {
  CustomerGroup,
  DashboardQORow,
  DealerGroup,
  DeliveryRecord,
  DPStatusType,
  OrderDetail,
  OrderStatusType,
  QueueDeliveryRaw,
} from "@/types/dashboard";

const pad2 = (value: number) => value.toString().padStart(2, "0");

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const safeText = (value: unknown, fallback = ""): string => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const formatTime = (value: string | null | undefined): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const formatDateTimeToDate = (
  dateValue: string | null | undefined,
  timeValue?: string | null,
): string => {
  if (!dateValue) return "-";
  if (timeValue) return formatDate(`${dateValue}T${timeValue}`);
  return formatDate(dateValue);
};

const formatDateTimeToTime = (
  dateValue: string | null | undefined,
  timeValue?: string | null,
): string => {
  if (!dateValue && !timeValue) return "";
  if (dateValue && timeValue) return formatTime(`${dateValue}T${timeValue}`);
  return formatTime(dateValue);
};

const getTotalQty = (row: DashboardQORow): number => {
  return toNumber(
    row.initial_order_quantity ??
      row.InitialOrderQuantity ??
      row.current_order_quantity ??
      row.CurrentOrderQuantity ??
      row.approve_order_quantity ??
      row.ApproveOrderQuantity ??
      row.qo_cube,
    0,
  );
};

const getDeliveredQty = (row: DashboardQORow): number => {
  return (row.deliveries ?? []).reduce(
    (sum, item) => sum + toNumber(item.no_reserve, 0),
    0,
  );
};

const getSiteCode = (row: DashboardQORow): string => {
  return safeText(row.site_code ?? row.ShipToCode ?? row.site_temp_qo, "");
};

const getProductName = (row: DashboardQORow): string => {
  return safeText(
    row.material_description ??
      row.MaterialDescription ??
      row.concreate_type_name_concat,
    "ไม่ระบุสินค้า",
  );
};

const getOrderId = (row: DashboardQORow): string => {
  if (safeText(row.SaleOrderID, "")) return safeText(row.SaleOrderID);
  if (row.SaleOrderNum) return `SO-${row.SaleOrderNum}`;
  if (safeText(row.qo_code, "")) return safeText(row.qo_code);
  if (row.qo_id) return `QO-${row.qo_id}`;
  if (row.so_id) return `SO-${row.so_id}`;
  return "ORDER-TEMP";
};

const buildSpec = (row: DashboardQORow): string => {
  const parts = [
    safeText(row.qo_strength_type, ""),
    safeText(row.qo_compress, "") ? `${safeText(row.qo_compress)} KSC` : "",
    safeText(row.StructureName ?? row.StructureID, ""),
    safeText(row.UnloadMethod, ""),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "-";
};

const mapOrderStatus = (row: DashboardQORow): OrderStatusType => {
  const siteCode = getSiteCode(row);
  if (!siteCode) return "รอ Site code";

  const currentStatus = safeText(row.current_status ?? row.CurrentStatus, "").toLowerCase();
  if (row.win_lose_qo === 2) return "ยกเลิกรายการ";
  if (currentStatus.includes("cancel")) return "ยกเลิกรายการ";
  if (currentStatus.includes("ci")) return "ยกเลิกรายการ";

  const delivered = getDeliveredQty(row);
  const totalQty = getTotalQty(row);

  if (totalQty > 0 && delivered >= totalQty) return "ดำเนินการครบถ้วน";
  if ((row.deliveries ?? []).length > 0) return "อยู่ระหว่างจัดส่ง";

  if (
    currentStatus.includes("confirm") ||
    currentStatus.includes("wait") ||
    currentStatus.includes("pending")
  ) {
    return "รอดำเนินการ";
  }

  return "รอดำเนินการ";
};

const mapDPStatus = (row: DashboardQORow): DPStatusType => {
  const hasDispatch = Boolean(
    row.dispatch_code ?? row.dispatchNo ?? row.DispatchCode ?? row.plant_id ?? row.PlantID,
  );

  const delivered = getDeliveredQty(row);
  const totalQty = getTotalQty(row);

  if (hasDispatch && totalQty > 0 && delivered >= totalQty) return "DP ครบ";
  if (hasDispatch) return "DP เปิดแล้ว";
  if (!hasDispatch && row.is_send_price === 1) return "รอเปิด DP";
  return "รอปริมาณรวม";
};

const mapDeliveries = (deliveries: QueueDeliveryRaw[] | undefined): DeliveryRecord[] => {
  return (deliveries ?? []).map((item, index) => ({
    date: formatDateTimeToDate(item.date_booking, item.time_booking),
    time: formatDateTimeToTime(item.date_booking, item.time_booking),
    qty: toNumber(item.no_reserve, 0),
    truck: item.no_truck ? `${item.no_truck} เที่ยว` : "-",
    note: safeText(item.remark_dp, `รอบจัดส่ง ${index + 1}`),
  }));
};

const mapRowToOrder = (row: DashboardQORow): OrderDetail => {
  const deliveries = mapDeliveries(row.deliveries);
  const latestDelivery = deliveries[deliveries.length - 1];

  const schedSource =
    row.delivery_datetime ??
    row.DeliveryDateTime ??
    row.qo_date ??
    null;

  return {
    orderId: getOrderId(row),
    product: getProductName(row),
    spec: buildSpec(row),
    totalQty: getTotalQty(row),
    deliveries,
    status: mapOrderStatus(row),
    dpStatus: mapDPStatus(row),
    dpPlant: safeText(
      row.plant_id ??
        row.PlantID ??
        row.qo_plant_no,
      "-",
    ),
    schedDate: latestDelivery?.date || formatDate(schedSource),
    schedTime: latestDelivery?.time || formatTime(schedSource),
    truck: latestDelivery?.truck || safeText(row.TruckType ?? row.truck_type_name_concat, "-"),
    updateTime: formatTime(row.modify_at ?? row.modify ?? row.created_at ?? row.created) || "-",

    dispatchCode: safeText(row.dispatch_code ?? row.DispatchCode ?? row.dispatchNo, "-"),
    plantId: safeText(row.plant_id ?? row.PlantID ?? row.qo_plant_no, "-"),
    dealerCode: safeText(row.dealer_code ?? row.dealer_id, "-"),
    customerName: safeText(row.company_name ?? row.SoldToName, "-"),
    subCustomerName: safeText(
      row.sub_company_name ?? row.SubSoldToName ?? row.contact_person ?? row.qo_contact,
      "-",
    ),
    siteCode: safeText(row.site_code ?? row.ShipToCode ?? row.site_temp_qo, "-"),
    siteName: safeText(row.site_name ?? row.ShipToName ?? row.qo_project_name, "-"),
    siteLocation: safeText(row.site_location ?? row.qo_address, "-"),
    contactPerson: safeText(
      row.contract_person ?? row.contact_person ?? row.qo_contact ?? row.BookByName,
      "-",
    ),
    contactPhone: safeText(
      row.contract_phone ?? row.phone ?? row.qo_phone ?? row.BookByPhoneNumber,
      "-",
    ),
    currentStatusRaw: row.current_status ?? row.CurrentStatus ?? row.qo_status ?? null,
    memo: safeText(row.memo ?? row.Memo ?? row.qo_remark, ""),
    internalNote: safeText(row.internal_note ?? row.InternalNote, ""),
  };
};

const getDealerId = (row: DashboardQORow): string =>
  safeText(
    row.dealer_id,
    row.agent_store_id
      ? `DLR-${row.agent_store_id}`
      : row.FranchiseeCode
        ? `DLR-${row.FranchiseeCode}`
        : `DLR-TEMP-${row.qo_id ?? row.so_id ?? "X"}`,
  );

const getDealerName = (row: DashboardQORow): string =>
  safeText(
    row.dealer_name,
    row.agent_store_id
      ? `Dealer ${row.agent_store_id}`
      : row.FranchiseeCode
        ? `Dealer ${row.FranchiseeCode}`
        : `Dealer ${row.qo_id ?? row.so_id ?? "X"}`,
  );

const buildCustomerGroups = (rows: DashboardQORow[]): CustomerGroup[] => {
  const customerMap = new Map<string, CustomerGroup>();

  rows.forEach((row) => {
    const dealerId = getDealerId(row);
    const dealerName = getDealerName(row);

    const customerId = safeText(
      row.customer_id ?? row.SoldToCode,
      row.agent_store_id ? String(row.agent_store_id) : `customer-${row.qo_id ?? row.so_id ?? "x"}`,
    );

    const customerKey = `${dealerId}::${customerId}`;

    if (!customerMap.has(customerKey)) {
      customerMap.set(customerKey, {
        id: customerId,
        companyName: safeText(row.company_name ?? row.SoldToName, "ไม่ระบุชื่อลูกค้า"),
        contactPerson: safeText(
          row.contact_person ??
            row.sub_company_name ??
            row.SubSoldToName ??
            row.qo_contact,
          "-",
        ),
        contactLine: safeText(row.contact_line, "-"),
        phone: safeText(
          row.phone ??
            row.SoldToMobile ??
            row.SoldToTelephone ??
            row.qo_phone,
          "-",
        ),
        dealerId,
        dealerName,
        sites: [],
      });
    }

    const customer = customerMap.get(customerKey)!;
    const siteCode = safeText(
      row.site_code ?? row.ShipToCode ?? row.site_temp_qo,
      `SITE-TEMP-${row.qo_id ?? row.so_id ?? "x"}`,
    );

    let site = customer.sites.find((item) => item.siteCode === siteCode);

    if (!site) {
      site = {
        siteCode,
        siteName: safeText(
          row.site_name ?? row.ShipToName ?? row.qo_project_name,
          "ไม่ระบุไซต์งาน",
        ),
        location: safeText(row.site_location ?? row.qo_address, "-"),
        orders: [],
      };
      customer.sites.push(site);
    }

    site.orders.push(mapRowToOrder(row));
  });

  return Array.from(customerMap.values());
};

const groupRowsToDealers = (rows: DashboardQORow[]): DealerGroup[] => {
  const customers = buildCustomerGroups(rows);
  const dealerMap = new Map<string, DealerGroup>();

  customers.forEach((customer) => {
    if (!dealerMap.has(customer.dealerId)) {
      dealerMap.set(customer.dealerId, {
        dealerId: customer.dealerId,
        dealerName: customer.dealerName,
        customers: [],
      });
    }
    dealerMap.get(customer.dealerId)!.customers.push(customer);
  });

  return Array.from(dealerMap.values());
};

const groupRowsToCustomers = (rows: DashboardQORow[]): CustomerGroup[] => {
  return buildCustomerGroups(rows);
};

/**
 * Mock rows that imitate API/DB joined result
 */
const mockDashboardRows: DashboardQORow[] = [
  {
    qo_id: 1001,
    so_id: 5001,
    SaleOrderID: "SO-2026-0421",
    SaleOrderNum: 421,
    CurrentStatus: "WAIT_CONFIRM",
    DeliveryDateTime: "2026-04-02T16:30:00",
    ShipToCode: "K00088",
    ShipToName: "บ้านอนุชา ซ.10",
    SoldToCode: "C004501",
    SoldToName: "คุณอนุชา โฮมบิลด์",
    SoldToMobile: "092-999-8888",
    SubSoldToName: "คุณอนุชา",
    MaterialDescription: "คอนกรีต 180 KSC",
    InitialOrderQuantity: 9,
    DispatchCode: null,
    PlantID: "DP1",
    TruckType: "1 เที่ยว",

    agent_store_id: 501,
    project_id: 88,
    qo_code: "QO-2026-0421",
    qo_project_name: "บ้านอนุชา ซ.10",
    qo_cube: 9,
    qo_compress: "180",
    qo_strength_type: "คอนกรีตทั่วไป",
    qo_contact: "คุณอนุชา",
    qo_phone: "092-999-8888",
    qo_status: 0,
    qo_date: "2026-04-02T16:30:00",
    created: "2026-04-02T16:00:00",
    modify: "2026-04-02T16:18:00",
    concreate_type_name_concat: "คอนกรีต 180 KSC",
    truck_type_name_concat: "1 เที่ยว",
    is_send_price: 1,
    win_lose_qo: 0,
    qo_plant_no: "DP1",
    site_temp_qo: "K00088",

    customer_id: "C004501",
    company_name: "คุณอนุชา โฮมบิลด์",
    contact_person: "คุณอนุชา",
    contact_line: "@anucha_home",
    phone: "092-999-8888",

    site_code: "K00088",
    site_name: "บ้านอนุชา ซ.10",
    site_location: "ซ.เจริญนคร 10 ธนบุรี",

    dealer_id: "DLR-501",
    dealer_name: "Dealer กรุงเทพ 501",
    dealer_code: "501",

    deliveries: [],
  },
  {
    qo_id: 1002,
    so_id: 5002,
    SaleOrderID: "SO-2026-0310",
    SaleOrderNum: 310,
    CurrentStatus: "CONFIRM",
    DeliveryDateTime: "2026-04-01T10:30:00",
    ShipToCode: "K00452",
    ShipToName: "หมู่บ้านแสนสุข เฟส 1",
    SoldToCode: "C001234",
    SoldToName: "บจก. เมกะโปร คอนสตรัคชั่น",
    SoldToTelephone: "02-555-1234",
    SubSoldToName: "คุณสมชาย",
    MaterialDescription: "คอนกรีต 240 KSC",
    InitialOrderQuantity: 500,
    DispatchCode: "DP-0001",
    PlantID: "DP2",
    TruckType: "5 เที่ยว",
    Memo: "กำลังจัดส่ง",
    InternalNote: "งานคาน",

    agent_store_id: 1234,
    project_id: 452,
    qo_code: "QO-2026-0310",
    qo_project_name: "หมู่บ้านแสนสุข เฟส 1",
    qo_cube: 500,
    qo_compress: "240",
    qo_strength_type: "งานคาน",
    qo_contact: "คุณสมชาย",
    qo_phone: "02-555-1234",
    qo_status: 1,
    qo_date: "2026-04-01T10:30:00",
    created: "2026-03-20T08:00:00",
    modify: "2026-04-01T10:30:00",
    concreate_type_name_concat: "คอนกรีต 240 KSC",
    truck_type_name_concat: "5 เที่ยว",
    is_send_price: 1,
    win_lose_qo: 1,
    qo_plant_no: "DP2",
    site_temp_qo: "K00452",
    dispatchNo: "DP-0001",

    customer_id: "C001234",
    company_name: "บจก. เมกะโปร คอนสตรัคชั่น",
    contact_person: "คุณสมชาย",
    contact_line: "@megapro_official",
    phone: "02-555-1234",

    site_code: "K00452",
    site_name: "หมู่บ้านแสนสุข เฟส 1",
    site_location: "ถ.ราชพฤกษ์-นนทบุรี กม.12",

    dealer_id: "DLR-1234",
    dealer_name: "Dealer นนทบุรี 1234",
    dealer_code: "1234",

    deliveries: [
      {
        qo_id: 1002,
        so_id: 5002,
        truck_queue_id: 1,
        truck_queue_detail_id: 11,
        date_booking: "2026-03-25",
        time_booking: "08:00:00",
        no_reserve: 60,
        no_truck: 6,
        remark_dp: "งานคาน ชั้น 1",
        queue_status_id: 4,
      },
      {
        qo_id: 1002,
        so_id: 5002,
        truck_queue_id: 2,
        truck_queue_detail_id: 12,
        date_booking: "2026-03-28",
        time_booking: "09:30:00",
        no_reserve: 75.5,
        no_truck: 7,
        remark_dp: "งานคาน ชั้น 2",
        queue_status_id: 4,
      },
      {
        qo_id: 1002,
        so_id: 5002,
        truck_queue_id: 3,
        truck_queue_detail_id: 13,
        date_booking: "2026-04-01",
        time_booking: "10:30:00",
        no_reserve: 50,
        no_truck: 5,
        remark_dp: "กำลังจัดส่ง",
        queue_status_id: 2,
      },
    ],
  },
  {
    qo_id: 1003,
    so_id: 5003,
    SaleOrderID: "SO-2026-0298",
    SaleOrderNum: 298,
    CurrentStatus: "COMPLETE",
    DeliveryDateTime: "2026-03-28T14:15:00",
    ShipToCode: "K00453",
    ShipToName: "อาคารจอดรถ พลาซ่า",
    SoldToCode: "C001234",
    SoldToName: "บจก. เมกะโปร คอนสตรัคชั่น",
    SoldToTelephone: "02-555-1234",
    SubSoldToName: "คุณสมชาย",
    MaterialDescription: "คอนกรีต 280 KSC",
    InitialOrderQuantity: 120,
    DispatchCode: "DP-0002",
    PlantID: "DP1",
    TruckType: "6 เที่ยว",

    agent_store_id: 1234,
    project_id: 453,
    qo_code: "QO-2026-0298",
    qo_project_name: "อาคารจอดรถ พลาซ่า",
    qo_cube: 120,
    qo_compress: "280",
    qo_strength_type: "ผสมกันซึม",
    qo_contact: "คุณสมชาย",
    qo_phone: "02-555-1234",
    qo_status: 1,
    qo_date: "2026-03-28T14:15:00",
    created: "2026-03-20T08:00:00",
    modify: "2026-03-28T14:15:00",
    concreate_type_name_concat: "คอนกรีต 280 KSC",
    truck_type_name_concat: "6 เที่ยว",
    is_send_price: 1,
    win_lose_qo: 1,
    qo_plant_no: "DP1",
    site_temp_qo: "K00453",
    dispatchNo: "DP-0002",

    customer_id: "C001234",
    company_name: "บจก. เมกะโปร คอนสตรัคชั่น",
    contact_person: "คุณสมชาย",
    contact_line: "@megapro_official",
    phone: "02-555-1234",

    site_code: "K00453",
    site_name: "อาคารจอดรถ พลาซ่า",
    site_location: "ซ.อารีย์ 4 แขวงพญาไท",

    dealer_id: "DLR-1234",
    dealer_name: "Dealer นนทบุรี 1234",
    dealer_code: "1234",

    deliveries: [
      {
        qo_id: 1003,
        so_id: 5003,
        truck_queue_id: 4,
        truck_queue_detail_id: 14,
        date_booking: "2026-03-25",
        time_booking: "06:00:00",
        no_reserve: 60,
        no_truck: 6,
        remark_dp: "งานพื้นชั้น 1",
        queue_status_id: 4,
      },
      {
        qo_id: 1003,
        so_id: 5003,
        truck_queue_id: 5,
        truck_queue_detail_id: 15,
        date_booking: "2026-03-28",
        time_booking: "14:15:00",
        no_reserve: 60,
        no_truck: 6,
        remark_dp: "งานพื้นชั้น 2",
        queue_status_id: 4,
      },
    ],
  },
  {
    qo_id: 1004,
    so_id: 5004,
    SaleOrderID: "SO-2026-0401",
    SaleOrderNum: 401,
    CurrentStatus: "CANCEL",
    DeliveryDateTime: null,
    ShipToCode: "ST-9902",
    ShipToName: "โกดังสินค้า B",
    SoldToCode: "C002891",
    SoldToName: "หจก. ทรัพย์ทวี การโยธา 2024",
    SoldToMobile: "081-234-5678",
    SubSoldToName: "คุณนารี",
    MaterialDescription: "คอนกรีต 240 KSC",
    InitialOrderQuantity: 300,
    DispatchCode: null,
    PlantID: "DP3",
    TruckType: null,

    agent_store_id: 2891,
    project_id: 9902,
    qo_code: "QO-2026-0401",
    qo_project_name: "โกดังสินค้า B",
    qo_cube: 300,
    qo_compress: "240",
    qo_strength_type: "งานพื้น",
    qo_contact: "คุณนารี",
    qo_phone: "081-234-5678",
    qo_status: 2,
    created: "2026-04-01T08:00:00",
    modify: "2026-04-01T09:15:00",
    concreate_type_name_concat: "คอนกรีต 240 KSC",
    is_send_price: 0,
    win_lose_qo: 2,
    qo_plant_no: "DP3",
    site_temp_qo: "ST-9902",

    customer_id: "C002891",
    company_name: "หจก. ทรัพย์ทวี การโยธา 2024",
    contact_person: "คุณนารี",
    contact_line: "naree_line",
    phone: "081-234-5678",

    site_code: "ST-9902",
    site_name: "โกดังสินค้า B",
    site_location: "นิคมอุตสาหกรรมบางปู ซ.5",

    dealer_id: "DLR-2891",
    dealer_name: "Dealer สมุทรปราการ 2891",
    dealer_code: "2891",

    deliveries: [],
  },
];

export const DashboardService = {
  /**
   * จุดเดียวสำหรับเปลี่ยนจาก mock -> API/DB จริง
   */
  getQORows(): DashboardQORow[] {
    return mockDashboardRows;
  },

  getCompanyDashboardData(): DealerGroup[] {
    return groupRowsToDealers(this.getQORows());
  },

  getDealerDashboardData(dealerId?: string): CustomerGroup[] {
    const rows = dealerId
      ? this.getQORows().filter((row) => getDealerId(row) === dealerId)
      : this.getQORows();

    return groupRowsToCustomers(rows);
  },

  getDashboardData(): CustomerGroup[] {
    return groupRowsToCustomers(this.getQORows());
  },

  getMockData(): CustomerGroup[] {
    return groupRowsToCustomers(this.getQORows());
  },
};