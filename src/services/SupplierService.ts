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
    try {
      const response = await this.api.get(this.endpoint);
      console.log("📥 Supplier getActive response:", response);

      // ✅ Handle different response structures
      let data = response;
      if (response && response.data) {
        data = response.data;
      }

      // If data is an array, return it
      if (Array.isArray(data)) {
        return data;
      }

      // If data has a data property that is an array
      if (data && data.data && Array.isArray(data.data)) {
        return data.data;
      }

      // If data has a suppliers property that is an array
      if (data && data.suppliers && Array.isArray(data.suppliers)) {
        return data.suppliers;
      }

      console.warn("⚠️ Unexpected response format:", response);
      return [];
    } catch (error) {
      console.error("❌ Error in getActive:", error);
      throw error;
    }
  }

  async getAll(): Promise<Supplier[]> {
    try {
      const response = await this.api.get(`${this.endpoint}/all`);
      console.log("📥 Supplier getAll response:", response);

      let data = response;
      if (response && response.data) {
        data = response.data;
      }

      if (Array.isArray(data)) {
        return data;
      }

      if (data && data.data && Array.isArray(data.data)) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error("❌ Error in getAll:", error);
      throw error;
    }
  }

  async getById(id: number): Promise<Supplier> {
    const response = await this.api.get(`${this.endpoint}/${id}`);
    return response.data || response;
  }

  async create(data: any): Promise<Supplier> {
    const response = await this.api.post(this.endpoint, data);
    return response.data || response;
  }

  async update(id: number, data: any): Promise<Supplier> {
    const response = await this.api.put(`${this.endpoint}/${id}`, data);
    return response.data || response;
  }

  async delete(id: number): Promise<void> {
    await this.api.delete(`${this.endpoint}/${id}`);
  }

  async restore(id: number): Promise<Supplier> {
    const response = await this.api.post(`${this.endpoint}/${id}/restore`);
    return response.data || response;
  }

  async getLedger(id: number): Promise<any> {
    const response = await this.api.get(`${this.endpoint}/${id}/ledger`);
    return response.data || response;
  }
}

export default new SupplierService();
