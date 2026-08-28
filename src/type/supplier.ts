// src/types/supplier.ts
export interface Supplier {
  id: number;
  entrydate: string;
  supplier_name: string;
  address: string | null;
  contact_no: string;
  username: string;
  bin_nid: string | null;
  ope_balance: number | null;
  adv_balance: number | null;
  due_balance: number | null;
  validity: number;
  created_at: string;
  updated_at: string;
  full_name?: string;
  balance?: number;
}

export interface SupplierFormData {
  entrydate: string;
  supplier_name: string;
  address: string;
  contact_no: string;
  username: string;
  bin_nid: string;
  ope_balance: number;
  adv_balance: number;
  due_balance: number;
  validity: number;
}

export interface SupplierLedger {
  id: number;
  entry_date: string;
  supplier_id: number;
  table_name: string;
  unique_id: number;
  description: string | null;
  debit_amt: number;
  credit_amt: number;
  type: number;
  closing_balance: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}
