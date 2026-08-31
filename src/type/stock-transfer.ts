// src/types/stock-transfer.ts

export interface OutletRequest {
  id: number;
  request_no: string;
  request_date: string;
  requesting_outlet_id: number;
  source_outlet_id: number;
  request_type: number;
  status: number;
  requested_by: number;
  approved_by: number | null;
  approved_at: string | null;
  remarks: string | null;
  validity: number;
  created_at: string;
  updated_at: string;
  requesting_outlet?: Outlet;
  source_outlet?: Outlet;
  requested_by_user?: User;
  approved_by_user?: User;
  details?: OutletRequestDetail[];
  despatches?: OutletDespatch[];
}

export interface OutletRequestDetail {
  id: number;
  request_id: number;
  product_id: number;
  unit_id: number;
  requested_qty: number;
  approved_qty: number;
  despatched_qty: number;
  received_qty: number;
  remarks: string | null;
  validity: number;
  product?: Product;
  unit?: Unit;
}

export interface OutletDespatch {
  id: number;
  despatch_no: string;
  despatch_date: string;
  request_id: number | null;
  source_type: number;
  source_outlet_id: number;
  dest_outlet_id: number;
  vehicle_no: string | null;
  driver_name: string | null;
  despatched_by: number;
  status: number;
  total_qty: number;
  total_amount: number;
  remarks: string | null;
  validity: number;
  created_at: string;
  updated_at: string;
  source_outlet?: Outlet;
  dest_outlet?: Outlet;
  despatched_by_user?: User;
  request?: OutletRequest;
  details?: OutletDespatchDetail[];
  receives?: OutletReceive[];
}

export interface OutletDespatchDetail {
  id: number;
  despatch_id: number;
  request_detail_id: number | null;
  product_id: number;
  unit_id: number;
  despatch_qty: number;
  purchase_price: number;
  total_amount: number;
  remarks: string | null;
  validity: number;
  product?: Product;
  unit?: Unit;
  request_detail?: OutletRequestDetail;
  receive_details?: OutletReceiveDetail[];
}

export interface OutletReceive {
  id: number;
  receive_no: string;
  receive_date: string;
  despatch_id: number;
  receiving_outlet_id: number;
  received_by: number;
  status: number;
  remarks: string | null;
  validity: number;
  created_at: string;
  updated_at: string;
  receiving_outlet?: Outlet;
  received_by_user?: User;
  despatch?: OutletDespatch;
  details?: OutletReceiveDetail[];
}

export interface OutletReceiveDetail {
  id: number;
  receive_id: number;
  despatch_detail_id: number;
  product_id: number;
  despatched_qty: number;
  received_qty: number;
  short_qty: number;
  damage_qty: number;
  remarks: string | null;
  validity: number;
  product?: Product;
  despatch_detail?: OutletDespatchDetail;
}

export interface OutletStockLedger {
  id: number;
  entry_date: string;
  outlet_id: number;
  product_id: number;
  table_name: string;
  unique_id: number;
  in_qty: number;
  out_qty: number;
  balance_before: number;
  balance_after: number;
  type: number;
  user_id: number;
  remarks: string | null;
  validity: number;
  created_at: string;
  updated_at: string;
  outlet?: Outlet;
  product?: Product;
  user?: User;
}

export interface Outlet {
  id: number;
  outlet_code: string;
  outlet_name: string;
  address: string;
  contact_no: string;
  outlet_mgr: string;
  ho_mobile_no: string;
  status: number;
  validity: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Product {
  id: number;
  product_name: string;
  product_code: string;
  pur_price: number;
  sale_price: number;
  cost_price: number;
  vat_rate: number;
  sd_rate: number;
  unit_id: number;
  category_id: number;
  unit?: Unit;
  category?: Category;
}

export interface Unit {
  id: number;
  unit_name: string;
}

export interface Category {
  id: number;
  category_name: string;
}

// Status Constants
export const REQUEST_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  PARTIAL_APPROVED: 2,
  REJECTED: 3,
  DESPATCHED: 4,
  RECEIVED: 5,
  CLOSED: 6,
} as const;

export const REQUEST_TYPE = {
  HO_REQUEST: 1,
  OUTLET_TRANSFER: 2,
} as const;

export const DESPATCH_STATUS = {
  PENDING: 0,
  IN_TRANSIT: 1,
  RECEIVED: 2,
  PARTIAL_RECEIVED: 3,
  CANCELLED: 4,
} as const;

export const RECEIVE_STATUS = {
  PENDING: 0,
  COMPLETE: 1,
  PARTIAL: 2,
  DISCREPANCY: 3,
} as const;
