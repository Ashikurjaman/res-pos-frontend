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
  unit_name?: string;
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
  branch_stock?: number;
  head_office_stock?: number;
  total_stock?: number;
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

  // ✅ NEW: Search products with pagination
  async search(query: string, outletId: number = 1): Promise<Product[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const response = await this.api.get(`${this.endpoint}/search`, {
        params: {
          q: query,
          outlet_id: outletId,
          per_page: 20
        }
      });

      console.log('Search response:', response);

      // Handle different response structures
      let products: Product[] = [];
      if (response && typeof response === 'object') {
        if (response.data && Array.isArray(response.data)) {
          products = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          products = response.data.data;
        } else if (Array.isArray(response)) {
          products = response;
        }
      }

      return products;
    } catch (error) {
      console.error("❌ Error searching products:", error);
      throw error;
    }
  }

  // ✅ NEW: Search products with more options
  async searchAdvanced(params: {
    q?: string;
    category_id?: number;
    outlet_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<{ data: Product[]; total: number; current_page: number }> {
    try {
      const response = await this.api.get(`${this.endpoint}/search`, {
        params: {
          ...params,
          per_page: params.per_page || 20
        }
      });

      // Handle different response structures
      let result = {
        data: [] as Product[],
        total: 0,
        current_page: 1
      };

      if (response && typeof response === 'object') {
        if (response.data && Array.isArray(response.data)) {
          result.data = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          result.data = response.data.data;
          result.total = response.data.total || 0;
          result.current_page = response.data.current_page || 1;
        }
      }

      return result;
    } catch (error) {
      console.error("❌ Error searching products:", error);
      throw error;
    }
  }
}

export default new ProductService();
