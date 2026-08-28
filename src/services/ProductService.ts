// src/services/ProductService.ts
import ApiService from "./api";

export interface Product {
  id: number;
  entrydate: string;
  category_id: number;
  product_name: string;
  product_code: string;
  cost_price: number;
  pur_price: number;
  sale_price: number;
  expire: string | null;
  unit_id: number;
  vat_rate: number;
  sd_rate: number;
  scharge: number;
  product_type: number;
  product_image: string;
  opening_balance: number;
  supplier_id: string | null;
  food_type: number | null;
  status: number;
  validity: number;
}

export interface CreateProductData {
  data: {
    next_code: string;
    categories: Category[];
    units: Unit[];
    suppliers: Supplier[];
    food_types: FoodType[];
  };
}

interface Category {
  id: number;
  category_name: string;
}

interface Unit {
  id: number;
  unit_name: string;
}

interface Supplier {
  id: number;
  supplier_name: string;
  username: string;
}

interface FoodType {
  id: number;
  name: string;
}

class ProductService {
  private api = ApiService;
  private endpoint = "products";

  async getCreateData(): Promise<CreateProductData> {
    // ✅ GET request to fetch product creation data
    const response = await this.api.get(`${this.endpoint}/create-data`);
    return response;
  }

  async getAll(): Promise<Product[]> {
    return this.api.get(this.endpoint);
  }

  async getById(id: number): Promise<Product> {
    return this.api.get(`${this.endpoint}/${id}`);
  }

  async create(data: FormData): Promise<Product> {
    return this.api.post(this.endpoint, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async update(id: number, data: FormData): Promise<Product> {
    return this.api.post(`${this.endpoint}/${id}?_method=PUT`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async delete(id: number): Promise<void> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }

  async restore(id: number): Promise<Product> {
    return this.api.post(`${this.endpoint}/${id}/restore`);
  }

  async getByCategory(categoryId: number, outletId?: number): Promise<Product[]> {
    return this.api.get(`${this.endpoint}/by-category`, {
      params: { category_id: categoryId, outlet_id: outletId || 1 },
    });
  }
}

export default new ProductService();
