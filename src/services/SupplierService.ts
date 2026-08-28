// src/services/SupplierService.ts
import { BaseService } from "./BaseService";

export interface Supplier {
  id: number;
  entrydate: string;
  supplier_name: string;
  address: string | null;
  contact_no: string;
  username: string;
  bin_nid: string | null;
  ope_balance: number | null;
  adv_balance: number | null;
  due_balance: number | null;
  validity: number;
  created_at: string;
  updated_at: string;
}

class SupplierService extends BaseService {
  constructor() {
    super("suppliers");
  }

  async getActive(): Promise<Supplier[]> {
    const response = await this.api.get(this.endpoint);
    return response;
  }

  async getAll(): Promise<Supplier[]> {
    const response = await this.api.get(`${this.endpoint}/all`);
    return response;
  }

  async getLedger(id: number): Promise<{ supplier: Supplier; ledgers: any[] }> {
    const response = await this.api.get(`${this.endpoint}/${id}/ledger`);
    return response;
  }

  async create(data: any): Promise<Supplier> {
    const response = await this.api.post(this.endpoint, data);
    return response;
  }

  async update(id: number, data: any): Promise<Supplier> {
    const response = await this.api.put(`${this.endpoint}/${id}`, data);
    return response;
  }

  async delete(id: number): Promise<void> {
    await this.api.delete(`${this.endpoint}/${id}`);
  }

  async restore(id: number): Promise<Supplier> {
    const response = await this.api.post(`${this.endpoint}/${id}/restore`);
    return response;
  }
}

export default new SupplierService();
