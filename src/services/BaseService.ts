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
    return this.api.get(this.endpoint, { params });
  }

  async getById(id: number | string) {
    return this.api.get(`${this.endpoint}/${id}`);
  }

  async create(data: any) {
    return this.api.post(this.endpoint, data);
  }

  async update(id: number | string, data: any) {
    return this.api.put(`${this.endpoint}/${id}`, data);
  }

  async delete(id: number | string) {
    return this.api.delete(`${this.endpoint}/${id}`);
  }

  async restore(id: number | string) {
    return this.api.post(`${this.endpoint}/${id}/restore`);
  }
}