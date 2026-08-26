// src/types/outlet.ts
export interface Outlet {
  id: number;
  entrydate: string;
  outlet_code: string;
  outlet_name: string;
  short_name: string | null;
  outlet_address: string;
  outlet_mgr: string;
  mgr_contact_no: string;
  ho_mobile_no: string;
  status: number;
  vat_reg_no_old: string | null;
  vat_reg_no_new: string | null;
  validity: number;
  created_at: string;
  updated_at: string;
  // Accessors from Laravel
  status_label?: string;
  validity_label?: string;
  full_address?: string;
}

export interface OutletFormData {
  entrydate: string;
  outlet_code: string;
  outlet_name: string;
  short_name: string;
  outlet_address: string;
  outlet_mgr: string;
  mgr_contact_no: string;
  ho_mobile_no: string;
  status: number;
  vat_reg_no_old: string;
  vat_reg_no_new: string;
  validity: number;
}