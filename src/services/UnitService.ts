// src/services/UnitService.ts
import { BaseService } from "./BaseService";

export interface Unit {
  id: number;
  unit_name: string;
  status: number;
  validity: number;
  created_at?: string;
  updated_at?: string;
}

export interface UnitFormData {
  unit_name: string;
  status: number;
  validity: number;
}

class UnitService extends BaseService {
  constructor() {
    super("unit");
  }

  async getActive(): Promise<Unit[]> {
    const response = await this.api.get(`${this.endpoint}/active`);
    return response.data || response;
  }

  async create(data: UnitFormData): Promise<Unit> {
    const response = await this.api.post(this.endpoint, data);
    return response.data || response;
  }

  async update(id: number, data: Partial<UnitFormData>): Promise<Unit> {
    const response = await this.api.put(`${this.endpoint}/${id}`, data);
    return response.data || response;
  }

  async delete(id: number): Promise<void> {
    await this.api.delete(`${this.endpoint}/${id}`);
  }

  async restore(id: number): Promise<Unit> {
    const response = await this.api.post(`${this.endpoint}/${id}/restore`);
    return response.data || response;
  }
}

export default new UnitService();
