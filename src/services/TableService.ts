// src/services/TableService.ts
import { BaseService } from "./BaseService";

export interface Table {
  id: number;
  table_number: string;
  table_name: string;
  status: "available" | "occupied" | "reserved";
  validity: number;
  created_at: string;
  updated_at: string;
}

export interface TableFormData {
  table_number: string;
  table_name: string;
  status: "available" | "occupied" | "reserved";
}

class TableService extends BaseService {
  constructor() {
    super("tables");
  }

  // ✅ Override methods to ensure proper error handling
  async getAll(): Promise<Table[]> {
    try {
      const response = await this.api.get(this.endpoint);
      return response;
    } catch (error: any) {
      console.error("Error fetching tables:", error);
      throw error;
    }
  }

  async create(data: TableFormData): Promise<Table> {
    try {
      const response = await this.api.post(this.endpoint, data);
      return response;
    } catch (error: any) {
      console.error("Error creating table:", error);
      throw error;
    }
  }

  async update(id: number, data: Partial<TableFormData>): Promise<Table> {
    try {
      const response = await this.api.put(`${this.endpoint}/${id}`, data);
      return response;
    } catch (error: any) {
      console.error("Error updating table:", error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.api.delete(`${this.endpoint}/${id}`);
    } catch (error: any) {
      console.error("Error deleting table:", error);
      throw error;
    }
  }

  async updateStatus(id: number, status: string): Promise<Table> {
    try {
      const response = await this.api.put(`${this.endpoint}/${id}/status`, {
        status,
      });
      return response;
    } catch (error: any) {
      console.error("Error updating table status:", error);
      throw error;
    }
  }
}

export default new TableService();
