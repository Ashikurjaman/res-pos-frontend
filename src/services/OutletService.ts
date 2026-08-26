// src/services/OutletService.ts
import { BaseService } from "./BaseService";
import { Outlet, OutletFormData } from "../types/outlet";

class OutletService extends BaseService {
  constructor() {
    super("outlets");
  }

  async getAll(): Promise<Outlet[]> {
    return this.api.get(`${this.endpoint}/all`);
  }

  async getActive(): Promise<Outlet[]> {
    return this.api.get(`${this.endpoint}/active`);
  }

  async create(data: OutletFormData): Promise<Outlet> {
    return this.api.post(this.endpoint, data);
  }

  async update(id: number, data: Partial<OutletFormData>): Promise<Outlet> {
    return this.api.put(`${this.endpoint}/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }

  async restore(id: number): Promise<Outlet> {
    return this.api.post(`${this.endpoint}/${id}/restore`);
  }
}

export default new OutletService();