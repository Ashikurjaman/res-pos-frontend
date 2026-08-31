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
  food_type_id: number | null; // ✅ Fixed
  status: number;
  validity: number;
}

export interface CreateProductData {
  next_code: string;
  categories: Category[];
  units: Unit[];
  suppliers: Supplier[];
  food_types: FoodType[];
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
  type_name?: string;
}

class ProductService {
  private api = ApiService;
  private endpoint = "products";

  async getCreateData(): Promise<CreateProductData> {
    try {
      const response = await this.api.get(`${this.endpoint}/create-data`);
      return response;
    } catch (error) {
      console.error("❌ ProductService error:", error);
      throw error;
    }
  }

  async getAll(): Promise<Product[]> {
    const response = await this.api.get(this.endpoint);
    return response.data || response;
  }

  async getById(id: number): Promise<Product> {
    const response = await this.api.get(`${this.endpoint}/${id}`);
    return response.data || response;
  }

  async create(data: FormData): Promise<Product> {
    const response = await this.api.post(this.endpoint, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data || response;
  }

  async update(id: number, data: FormData): Promise<Product> {
    const response = await this.api.post(
      `${this.endpoint}/${id}?_method=PUT`,
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data || response;
  }

  async delete(id: number): Promise<void> {
    await this.api.delete(`${this.endpoint}/${id}`);
  }

  async restore(id: number): Promise<Product> {
    const response = await this.api.post(`${this.endpoint}/${id}/restore`);
    return response.data || response;
  }

  async getByCategory(
    categoryId: number,
    outletId?: number,
  ): Promise<Product[]> {
    const response = await this.api.get(`${this.endpoint}/by-category`, {
      params: { category_id: categoryId, outlet_id: outletId || 1 },
    });
    return response.data || response;
  }

  async getWithStock(): Promise<any[]> {
    const response = await this.api.get(`${this.endpoint}/with-stock`);
    return response.data || response;
  }

  async updateStock(
    id: number,
    stock: number,
    outletId: number = 1,
  ): Promise<any> {
    const response = await this.api.put(`${this.endpoint}/${id}/stock`, {
      stock,
      outlet_id: outletId,
    });
    return response.data || response;
  }
}

export default new ProductService();
