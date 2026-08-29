// src/services/CategoryService.ts
import { BaseService } from "./BaseService";

export interface Category {
  id: number;
  category_name: string;
  status: number;
  validity: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryFormData {
  category_name: string;
  status: number;
  validity: number;
}

class CategoryService extends BaseService {
  constructor() {
    super("category");
  }

  async getActive(): Promise<Category[]> {
    const response = await this.api.get(`${this.endpoint}/active`);
    return response.data || response;
  }

  async create(data: CategoryFormData): Promise<Category> {
    const response = await this.api.post(this.endpoint, data);
    return response.data || response;
  }

  async update(id: number, data: Partial<CategoryFormData>): Promise<Category> {
    const response = await this.api.put(`${this.endpoint}/${id}`, data);
    return response.data || response;
  }

  async delete(id: number): Promise<void> {
    await this.api.delete(`${this.endpoint}/${id}`);
  }

  async restore(id: number): Promise<Category> {
    const response = await this.api.post(`${this.endpoint}/${id}/restore`);
    return response.data || response;
  }
}

export default new CategoryService();
