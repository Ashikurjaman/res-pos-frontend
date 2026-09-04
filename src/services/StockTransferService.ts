// src/services/StockTransferService.ts
import ApiService from "./api";

export interface CreateRequestData {
  request_date?: string;
  requesting_outlet_id: number;
  source_outlet_id?: number;
  request_type: number;
  items: {
    product_id: number;
    unit_id: number;
    requested_qty: number;
    remarks?: string;
  }[];
  remarks?: string;
}

export interface ApproveRequestData {
  items: {
    detail_id: number;
    approved_qty: number;
    remarks?: string;
  }[];
  remarks?: string;
}

export interface CreateDespatchData {
  request_id: number;
  despatch_date?: string;
  source_outlet_id?: number;
  vehicle_no?: string;
  driver_name?: string;
  items: {
    request_detail_id: number;
    despatch_qty: number;
    remarks?: string;
  }[];
  remarks?: string;
}

export interface ReceiveStockData {
  despatch_id: number;
  receive_date?: string;
  items: {
    despatch_detail_id: number;
    received_qty: number;
    short_qty?: number;
    damage_qty?: number;
    remarks?: string;
  }[];
  remarks?: string;
}

class StockTransferService {
  private api = ApiService;

  // ============ REQUEST ============
  async getRequests(params?: {
    outlet_id?: number;
    status?: number;
    type?: number;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<any> {
    try {
      const response = await this.api.get("/stock-requests", { params });
      console.log('📦 getRequests response:', response);
      return response;
    } catch (error) {
      console.error("❌ Error fetching requests:", error);
      throw error;
    }
  }

  async getRequest(id: number): Promise<any> {
    try {
      const response = await this.api.get(`/stock-requests/${id}`);
      console.log('📦 getRequest response:', response);
      return response;
    } catch (error) {
      console.error(`❌ Error fetching request ${id}:`, error);
      throw error;
    }
  }

  async createRequest(data: CreateRequestData): Promise<any> {
    try {
      const response = await this.api.post("/stock-requests", data);
      return response;
    } catch (error) {
      console.error("❌ Error creating request:", error);
      throw error;
    }
  }

  async approveRequest(id: number, data: ApproveRequestData): Promise<any> {
    try {
      const response = await this.api.post(`/stock-requests/${id}/approve`, data);
      return response;
    } catch (error) {
      console.error(`❌ Error approving request ${id}:`, error);
      throw error;
    }
  }

  async getPendingCount(): Promise<number> {
    try {
      const response = await this.api.get("/stock-requests/pending-count");
      return response?.data?.pending_count || 0;
    } catch (error) {
      console.error("❌ Error fetching pending count:", error);
      return 0;
    }
  }

  // ============ DESPATCH ============
  async getDespatches(params?: {
    outlet_id?: number;
    status?: number;
    request_id?: number;
    search?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<any> {
    try {
      const response = await this.api.get("/stock-despatches", { params });
      console.log('📦 getDespatches response:', response);
      return response;
    } catch (error) {
      console.error("❌ Error fetching despatches:", error);
      throw error;
    }
  }

  async getDespatch(id: number): Promise<any> {
    try {
      const response = await this.api.get(`/stock-despatches/${id}`);
      console.log('📦 getDespatch response:', response);
      return response;
    } catch (error) {
      console.error(`❌ Error fetching despatch ${id}:`, error);
      throw error;
    }
  }

  async createDespatch(data: CreateDespatchData): Promise<any> {
    try {
      const response = await this.api.post("/stock-despatches", data);
      console.log('📦 createDespatch response:', response);
      return response;
    } catch (error) {
      console.error("❌ Error creating despatch:", error);
      throw error;
    }
  }

  // ✅ Update despatch status
  async updateDespatchStatus(id: number, status: number): Promise<any> {
    try {
      const response = await this.api.put(`/stock-despatches/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error(`❌ Error updating despatch ${id} status:`, error);
      throw error;
    }
  }

  // ✅ Cancel despatch
  async cancelDespatch(id: number): Promise<any> {
    try {
      const response = await this.api.post(`/stock-despatches/${id}/cancel`);
      return response;
    } catch (error) {
      console.error(`❌ Error cancelling despatch ${id}:`, error);
      throw error;
    }
  }

  // ✅ Get despatch statistics
  async getDespatchStatistics(outletId?: number): Promise<any> {
    try {
      const params = outletId ? { outlet_id: outletId } : {};
      const response = await this.api.get("/stock-despatches/statistics", { params });
      return response;
    } catch (error) {
      console.error("❌ Error fetching despatch statistics:", error);
      throw error;
    }
  }

  // ============ RECEIVE ============
  async getReceives(params?: {
    outlet_id?: number;
    status?: number;
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<any> {
    try {
      const response = await this.api.get("/stock-receives", { params });
      return response;
    } catch (error) {
      console.error("❌ Error fetching receives:", error);
      throw error;
    }
  }

  async getReceive(id: number): Promise<any> {
    try {
      const response = await this.api.get(`/stock-receives/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Error fetching receive ${id}:`, error);
      throw error;
    }
  }

  async receiveStock(data: ReceiveStockData): Promise<any> {
    try {
      const response = await this.api.post("/stock-receives", data);
      return response;
    } catch (error) {
      console.error("❌ Error receiving stock:", error);
      throw error;
    }
  }

  // ✅ Update receive status
  async updateReceiveStatus(id: number, status: number): Promise<any> {
    try {
      const response = await this.api.put(`/stock-receives/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error(`❌ Error updating receive ${id} status:`, error);
      throw error;
    }
  }

  // src/services/StockTransferService.ts

  // ✅ Add this method
  async getPendingRequests(params?: {
      outlet_id?: number;
      search?: string;
  }): Promise<any> {
      try {
          const response = await this.api.get("/stock-requests/pending-for-despatch", { params });
          console.log('📦 getPendingRequests response:', response);
          return response;
      } catch (error) {
          console.error("❌ Error fetching pending requests:", error);
          throw error;
      }
  }
}

export default new StockTransferService();
