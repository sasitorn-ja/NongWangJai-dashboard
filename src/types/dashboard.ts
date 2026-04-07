export type OrderStatusType =
  | "อยู่ระหว่างจัดส่ง"
  | "ดำเนินการครบถ้วน"
  | "รอดำเนินการ"
  | "ยกเลิกรายการ"
  | "รอ Site code";

export type DPStatusType =
  | "รอปริมาณรวม"
  | "รอเปิด DP"
  | "DP เปิดแล้ว"
  | "DP ครบ";

export interface DeliveryRecord {
  date: string;
  time: string;
  qty: number;
  truck: string;
  note: string;
}

export interface OrderDetail {
  orderId: string;
  product: string;
  spec: string;
  totalQty: number;
  deliveries: DeliveryRecord[];
  status: OrderStatusType;
  dpStatus: DPStatusType;
  dpPlant: string;
  schedDate: string;
  schedTime: string;
  truck: string;
  updateTime: string;
}

export interface SiteDetail {
  siteCode: string;
  siteName: string;
  location: string;
  orders: OrderDetail[];
}

export interface CustomerGroup {
  id: string;
  companyName: string;
  contactPerson: string;
  contactLine: string;
  phone: string;
  dealerId: string;
  dealerName: string;
  sites: SiteDetail[];
}

export interface DealerGroup {
  dealerId: string;
  dealerName: string;
  customers: CustomerGroup[];
}

/** DB raw: tbt_order_qo */
export interface QORaw {
  qo_id: number;
  agent_store_id: number | null;
  project_id: number | null;
  qo_code: string | null;
  qo_project_name: string | null;
  qo_cube: number | null;
  qo_compress: string | null;
  qo_strength_type: string | null;
  qo_contact: string | null;
  qo_phone: string | null;
  concrete_type_id: number | null;
  qo_minimum_slum_id: number | null;
  qo_maximum_slum_id: number | null;
  example_test_id: number | null;
  qo_storage_area_id: number | null;
  qo_testing_site_id: number | null;
  no_of_blocks: number | null;
  qo_main_factory: string | null;
  qo_address: string | null;
  lat: string | null;
  lng: string | null;
  link_map: string | null;
  user_request_id: number | null;
  user_receive_id: number | null;
  approver_id: number | null;
  groupline_id: number | null;
  qo_status: number | null;
  payment_id: number | null;
  payment_condition_id: number | null;
  credit_date_id: number | null;
  price_up_date: string | null;
  qo_remark: string | null;
  qo_date: string | null;
  truck_type_id: number | null;
  status_active: number | null;
  province_id: number | null;
  district_id: number | null;
  sub_district_id: number | null;
  qo_delivery_type: number | null;
  created: string | null;
  modify: string | null;
  url_png: string | null;
  concreate_type_name_concat: string | null;
  truck_type_name_concat: string | null;
  is_send_price: number | null;
  win_lose_qo: number | null;
  concreate_save_type: string | null;
  delivery_type_filter: string | null;
  qo_plant_no: string | null;
  oneclick_subdistrict_id: string | null;
  oneclick_district_id: string | null;
  oneclick_province_id: string | null;
  oneclick_compcode: string | null;
  site_temp_qo: string | null;
  agency_type_id: string | null;
  agt_detail_id: string | null;
  special_requirement_id: string | null;
  special_features_id: string | null;
  dispatchNo: string | null;
}

/** optional raw queue join */
export interface QueueDeliveryRaw {
  qo_id: number;
  truck_queue_id: number;
  truck_queue_detail_id?: number | null;
  date_booking: string | null;
  time_booking: string | null;
  no_reserve: number | null;
  no_truck?: number | null;
  remark_dp?: string | null;
  queue_status_id?: number | null;
}

/** UI grouping raw */
export interface DashboardQORow extends QORaw {
  customer_id?: string | null;
  company_name?: string | null;
  contact_person?: string | null;
  contact_line?: string | null;
  phone?: string | null;

  site_code?: string | null;
  site_name?: string | null;
  site_location?: string | null;

  dealer_id?: string | null;
  dealer_name?: string | null;

  deliveries?: QueueDeliveryRaw[];
}