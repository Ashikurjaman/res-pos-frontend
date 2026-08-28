// src/types/foodType.ts
export interface FoodType {
  id: number;
  type_name: string;
  printer_ip: string | null;
  onlinestatus: number;
  validity: number;
  created_at: string;
  updated_at: string;
  products_count?: number;
}

export interface FoodTypeFormData {
  type_name: string;
  printer_ip: string;
  onlinestatus: number;
  validity: number;
}
