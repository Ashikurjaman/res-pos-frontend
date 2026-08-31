// src/types/product.ts
export interface Product {
  id: number;
  entrydate: string;
  category_id: number;
  product_name: string;
  product_code: string;
  cost_price: number;
  pur_price: number;
  last_price: number;
  previous_price: number | null;
  avg_price: number;
  sale_price: number;
  expire: string | null;
  unit_id: number;
  mfExStatus: string | null;
  extra_status: string | null;
  prdbelowrange: number | null;
  imagepath: string | null;
  user_id: number;
  dis_status: number | null;
  vat_rate: number;
  sd_rate: number;
  scharge: number;
  product_type: number;
  product_image: string;
  opening_balance: number;
  supplier_id: string | null;
  food_type_id: number | null;
  status: number;
  validity: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  unit?: Unit;
  suppliers?: Supplier[];
  branch_stores?: BranchStore[];
  head_office_store?: HeadOfficeStore;
}

export interface ProductFormData {
  category_id: number;
  product_name: string;
  product_code: string;
  cost_price: number;
  pur_price: number;
  sale_price: number;
  expire: string;
  unit_id: number;
  dis_status: number;
  vat_rate: number;
  sd_rate: number;
  scharge: number;
  product_type: number;
  product_image: File | null;
  opening_balance: number;
  supplier_id: number[];
  food_type_id: number;
  outlet_id: number;
}

export interface CreateProductData {
  next_code: string;
  categories: Category[];
  units: Unit[];
  suppliers: Supplier[];
  food_types: FoodType[];
}

export interface Category {
  id: number;
  category_name: string;
  status?: number;
}

export interface Unit {
  id: number;
  unit_name: string;
  status?: number;
}

export interface Supplier {
  id: number;
  supplier_name: string;
  username?: string;
  phone?: string;
  email?: string;
}

export interface FoodType {
  id: number;
  name: string;
  type_name?: string;
  onlinestatus?: number;
}

export interface BranchStore {
  id: number;
  branch_id: number;
  product_id: number;
  quantity: number;
}

export interface HeadOfficeStore {
  id: number;
  product_id: number;
  quantity: number;
}
