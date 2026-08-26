// src/types/company.ts
export interface Company {
  id: number;
  company_name: string;
  outlet_name: string;
  address: string;
  contact_no: string;
  email: string | null;
  slogan: string;
  pay_type: number; // 1 = Paid, 2 = Due
  validity: boolean; // 1 = Active, 0 = Inactive
  created_at: string;
  updated_at: string;
  // Accessors from Laravel
  pay_type_label?: string;
  validity_label?: string;
  full_address?: string;
}

export interface CompanyFormData {
  company_name: string;
  outlet_name: string;
  address: string;
  contact_no: string;
  email: string;
  slogan: string;
  pay_type: number;
  validity: boolean;
}