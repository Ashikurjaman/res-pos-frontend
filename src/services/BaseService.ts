// src/services/BaseService.ts
import ApiService from "./api";

export class BaseService {
  protected api = ApiService;
  protected module: string;

  constructor(module: string) {
    this.module = module;
  }

  protected get endpoint(): string {
    return `/${this.module}`;
  }

  async getAll(params?: Record<string, any>) {
    const response = await this.api.get(this.endpoint, { params });
    return response.data || response;
  }

  async getById(id: number | string) {
    const response = await this.api.get(`${this.endpoint}/${id}`);
    return response.data || response;
  }

  async create(data: any) {
    const response = await this.api.post(this.endpoint, data);
    return response.data || response;
  }

  async update(id: number | string, data: any) {
    const response = await this.api.put(`${this.endpoint}/${id}`, data);
    return response.data || response;
  }

  async delete(id: number | string) {
    const response = await this.api.delete(`${this.endpoint}/${id}`);
    return response.data || response;
  }

  async restore(id: number | string) {
    const response = await this.api.post(`${this.endpoint}/${id}/restore`);
    return response.data || response;
  }
}
