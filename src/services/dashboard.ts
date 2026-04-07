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

const mapOrderStatus = (row: DashboardQORow): OrderStatusType => {
  if (!row.site_code) return "รอ Site code";
  if (row.win_lose_qo === 2) return "ยกเลิกรายการ";

  const delivered = (row.deliveries ?? []).reduce(
    (sum, item) => sum + Number(item.no_reserve ?? 0),
    0,
  );
  const totalQty = Number(row.qo_cube ?? 0);

  if (totalQty > 0 && delivered >= totalQty) return "ดำเนินการครบถ้วน";
  if ((row.deliveries ?? []).length > 0) return "อยู่ระหว่างจัดส่ง";
  return "รอดำเนินการ";
};

const mapDPStatus = (row: DashboardQORow): DPStatusType => {
  const hasDispatch = Boolean(row.dispatchNo);
  const delivered = (row.deliveries ?? []).reduce(
    (sum, item) => sum + Number(item.no_reserve ?? 0),
    0,
  );
  const totalQty = Number(row.qo_cube ?? 0);

  if (hasDispatch && totalQty > 0 && delivered >= totalQty) return "DP ครบ";
  if (hasDispatch) return "DP เปิดแล้ว";
  if (!row.dispatchNo && row.is_send_price === 1) return "รอเปิด DP";
  return "รอปริมาณรวม";
};

const mapDeliveries = (
  deliveries: QueueDeliveryRaw[] | undefined,
): DeliveryRecord[] => {
  return (deliveries ?? []).map((item, index) => ({
    date: formatDateTimeToDate(item.date_booking, item.time_booking),
    time: formatDateTimeToTime(item.date_booking, item.time_booking),
    qty: Number(item.no_reserve ?? 0),
    truck: item.no_truck ? `${item.no_truck} เที่ยว` : "-",
    note: item.remark_dp?.trim() || `รอบจัดส่ง ${index + 1}`,
  }));
};

const buildSpec = (row: DashboardQORow): string => {
  const parts = [
    row.qo_strength_type?.trim(),
    row.qo_compress?.trim() ? `${row.qo_compress.trim()} KSC` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "-";
};

const mapRowToOrder = (row: DashboardQORow): OrderDetail => {
  const deliveries = mapDeliveries(row.deliveries);
  const latestDelivery = deliveries[deliveries.length - 1];

  return {
    orderId: row.qo_code || `QO-${row.qo_id}`,
    product: row.concreate_type_name_concat?.trim() || "ไม่ระบุสินค้า",
    spec: buildSpec(row),
    totalQty: Number(row.qo_cube ?? 0),
    deliveries,
    status: mapOrderStatus(row),
    dpStatus: mapDPStatus(row),
    dpPlant: row.qo_plant_no || "-",
    schedDate: latestDelivery?.date || formatDate(row.qo_date),
    schedTime: latestDelivery?.time || formatTime(row.qo_date),
    truck: latestDelivery?.truck || row.truck_type_name_concat || "-",
    updateTime: formatTime(row.modify) || "-",
  };
};

const getDealerId = (row: DashboardQORow) =>
  row.dealer_id ||
  (row.agent_store_id ? `DLR-${row.agent_store_id}` : `DLR-TEMP-${row.qo_id}`);

const getDealerName = (row: DashboardQORow) =>
  row.dealer_name || `Dealer ${row.agent_store_id ?? row.qo_id}`;

const buildCustomerGroups = (rows: DashboardQORow[]): CustomerGroup[] => {
  const customerMap = new Map<string, CustomerGroup>();

  rows.forEach((row) => {
    const dealerId = getDealerId(row);
    const dealerName = getDealerName(row);

    const customerId =
      row.customer_id ||
      String(row.agent_store_id ?? "") ||
      `customer-${row.qo_id}`;

    const customerKey = `${dealerId}::${customerId}`;

    if (!customerMap.has(customerKey)) {
      customerMap.set(customerKey, {
        id: customerId,
        companyName: row.company_name || "ไม่ระบุชื่อลูกค้า",
        contactPerson: row.contact_person || row.qo_contact || "-",
        contactLine: row.contact_line || "-",
        phone: row.phone || row.qo_phone || "-",
        dealerId,
        dealerName,
        sites: [],
      });
    }

    const customer = customerMap.get(customerKey)!;
    const siteCode = row.site_code || row.site_temp_qo || `SITE-TEMP-${row.qo_id}`;

    let site = customer.sites.find((item) => item.siteCode === siteCode);

    if (!site) {
      site = {
        siteCode,
        siteName: row.site_name || row.qo_project_name || "ไม่ระบุไซต์งาน",
        location: row.site_location || row.qo_address || "-",
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

const mockDashboardRows: DashboardQORow[] = [
  {
    qo_id: 1001,
    agent_store_id: 501,
    project_id: 88,
    qo_code: "QO-2026-0421",
    qo_project_name: "บ้านอนุชา ซ.10",
    qo_cube: 9,
    qo_compress: "180",
    qo_strength_type: "คอนกรีตทั่วไป",
    qo_contact: "คุณอนุชา",
    qo_phone: "092-999-8888",
    concrete_type_id: 1,
    qo_minimum_slum_id: null,
    qo_maximum_slum_id: null,
    example_test_id: null,
    qo_storage_area_id: null,
    qo_testing_site_id: null,
    no_of_blocks: null,
    qo_main_factory: "โรงงานหลัก 1",
    qo_address: "ซ.เจริญนคร 10 ธนบุรี",
    lat: null,
    lng: null,
    link_map: null,
    user_request_id: null,
    user_receive_id: null,
    approver_id: null,
    groupline_id: null,
    qo_status: 0,
    payment_id: null,
    payment_condition_id: null,
    credit_date_id: null,
    price_up_date: null,
    qo_remark: null,
    qo_date: "2026-04-02T16:30:00",
    truck_type_id: null,
    status_active: 1,
    province_id: null,
    district_id: null,
    sub_district_id: null,
    qo_delivery_type: 1,
    created: "2026-04-02T16:00:00",
    modify: "2026-04-02T16:18:00",
    url_png: null,
    concreate_type_name_concat: "คอนกรีต 180 KSC",
    truck_type_name_concat: "1 เที่ยว",
    is_send_price: 1,
    win_lose_qo: 0,
    concreate_save_type: null,
    delivery_type_filter: "1",
    qo_plant_no: "DP1",
    oneclick_subdistrict_id: null,
    oneclick_district_id: null,
    oneclick_province_id: null,
    oneclick_compcode: null,
    site_temp_qo: "K00088",
    agency_type_id: null,
    agt_detail_id: null,
    special_requirement_id: null,
    special_features_id: null,
    dispatchNo: null,
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
    deliveries: [],
  },
  {
    qo_id: 1002,
    agent_store_id: 1234,
    project_id: 452,
    qo_code: "QO-2026-0310",
    qo_project_name: "หมู่บ้านแสนสุข เฟส 1",
    qo_cube: 500,
    qo_compress: "240",
    qo_strength_type: "งานคาน",
    qo_contact: "คุณสมชาย",
    qo_phone: "02-555-1234",
    concrete_type_id: 1,
    qo_minimum_slum_id: null,
    qo_maximum_slum_id: null,
    example_test_id: null,
    qo_storage_area_id: null,
    qo_testing_site_id: null,
    no_of_blocks: null,
    qo_main_factory: "โรงงาน A",
    qo_address: "ถ.ราชพฤกษ์-นนทบุรี กม.12",
    lat: null,
    lng: null,
    link_map: null,
    user_request_id: null,
    user_receive_id: null,
    approver_id: null,
    groupline_id: null,
    qo_status: 1,
    payment_id: null,
    payment_condition_id: null,
    credit_date_id: null,
    price_up_date: null,
    qo_remark: null,
    qo_date: "2026-04-01T10:30:00",
    truck_type_id: null,
    status_active: 1,
    province_id: null,
    district_id: null,
    sub_district_id: null,
    qo_delivery_type: 1,
    created: "2026-03-20T08:00:00",
    modify: "2026-04-01T10:30:00",
    url_png: null,
    concreate_type_name_concat: "คอนกรีต 240 KSC",
    truck_type_name_concat: "5 เที่ยว",
    is_send_price: 1,
    win_lose_qo: 1,
    concreate_save_type: null,
    delivery_type_filter: "1",
    qo_plant_no: "DP2",
    oneclick_subdistrict_id: null,
    oneclick_district_id: null,
    oneclick_province_id: null,
    oneclick_compcode: null,
    site_temp_qo: "K00452",
    agency_type_id: null,
    agt_detail_id: null,
    special_requirement_id: null,
    special_features_id: null,
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
    deliveries: [
      {
        qo_id: 1002,
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
    agent_store_id: 1234,
    project_id: 453,
    qo_code: "QO-2026-0298",
    qo_project_name: "อาคารจอดรถ พลาซ่า",
    qo_cube: 120,
    qo_compress: "280",
    qo_strength_type: "ผสมกันซึม",
    qo_contact: "คุณสมชาย",
    qo_phone: "02-555-1234",
    concrete_type_id: 1,
    qo_minimum_slum_id: null,
    qo_maximum_slum_id: null,
    example_test_id: null,
    qo_storage_area_id: null,
    qo_testing_site_id: null,
    no_of_blocks: null,
    qo_main_factory: "โรงงาน A",
    qo_address: "ซ.อารีย์ 4 แขวงพญาไท",
    lat: null,
    lng: null,
    link_map: null,
    user_request_id: null,
    user_receive_id: null,
    approver_id: null,
    groupline_id: null,
    qo_status: 1,
    payment_id: null,
    payment_condition_id: null,
    credit_date_id: null,
    price_up_date: null,
    qo_remark: null,
    qo_date: "2026-03-28T14:15:00",
    truck_type_id: null,
    status_active: 1,
    province_id: null,
    district_id: null,
    sub_district_id: null,
    qo_delivery_type: 1,
    created: "2026-03-20T08:00:00",
    modify: "2026-03-28T14:15:00",
    url_png: null,
    concreate_type_name_concat: "คอนกรีต 280 KSC",
    truck_type_name_concat: "6 เที่ยว",
    is_send_price: 1,
    win_lose_qo: 1,
    concreate_save_type: null,
    delivery_type_filter: "1",
    qo_plant_no: "DP1",
    oneclick_subdistrict_id: null,
    oneclick_district_id: null,
    oneclick_province_id: null,
    oneclick_compcode: null,
    site_temp_qo: "K00453",
    agency_type_id: null,
    agt_detail_id: null,
    special_requirement_id: null,
    special_features_id: null,
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
    deliveries: [
      {
        qo_id: 1003,
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
    agent_store_id: 2891,
    project_id: 9902,
    qo_code: "QO-2026-0401",
    qo_project_name: "โกดังสินค้า B",
    qo_cube: 300,
    qo_compress: "240",
    qo_strength_type: "งานพื้น",
    qo_contact: "คุณนารี",
    qo_phone: "081-234-5678",
    concrete_type_id: 1,
    qo_minimum_slum_id: null,
    qo_maximum_slum_id: null,
    example_test_id: null,
    qo_storage_area_id: null,
    qo_testing_site_id: null,
    no_of_blocks: null,
    qo_main_factory: "โรงงาน B",
    qo_address: "นิคมอุตสาหกรรมบางปู ซ.5",
    lat: null,
    lng: null,
    link_map: null,
    user_request_id: null,
    user_receive_id: null,
    approver_id: null,
    groupline_id: null,
    qo_status: 2,
    payment_id: null,
    payment_condition_id: null,
    credit_date_id: null,
    price_up_date: null,
    qo_remark: null,
    qo_date: null,
    truck_type_id: null,
    status_active: 1,
    province_id: null,
    district_id: null,
    sub_district_id: null,
    qo_delivery_type: 1,
    created: "2026-04-01T08:00:00",
    modify: "2026-04-01T09:15:00",
    url_png: null,
    concreate_type_name_concat: "คอนกรีต 240 KSC",
    truck_type_name_concat: null,
    is_send_price: 0,
    win_lose_qo: 2,
    concreate_save_type: null,
    delivery_type_filter: "1",
    qo_plant_no: "DP3",
    oneclick_subdistrict_id: null,
    oneclick_district_id: null,
    oneclick_province_id: null,
    oneclick_compcode: null,
    site_temp_qo: "ST-9902",
    agency_type_id: null,
    agt_detail_id: null,
    special_requirement_id: null,
    special_features_id: null,
    dispatchNo: null,
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
    deliveries: [],
  },
];

export const DashboardService = {
  getQORows(): DashboardQORow[] {
    return mockDashboardRows;
  },

  getCompanyDashboardData(): DealerGroup[] {
    return groupRowsToDealers(mockDashboardRows);
  },

  getDealerDashboardData(dealerId?: string): CustomerGroup[] {
    const rows = dealerId
      ? mockDashboardRows.filter((row) => getDealerId(row) === dealerId)
      : mockDashboardRows;

    return groupRowsToCustomers(rows);
  },

  getDashboardData(): CustomerGroup[] {
    return groupRowsToCustomers(mockDashboardRows);
  },

  getMockData(): CustomerGroup[] {
    return groupRowsToCustomers(mockDashboardRows);
  },
};