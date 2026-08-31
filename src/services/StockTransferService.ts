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
  }): Promise<any> {
    const response = await this.api.get("/stock-requests", { params });
    return response.data || response;
  }

  async getRequest(id: number): Promise<any> {
    const response = await this.api.get(`/stock-requests/${id}`);
    return response.data || response;
  }

  async createRequest(data: CreateRequestData): Promise<any> {
    const response = await this.api.post("/stock-requests", data);
    return response.data || response;
  }

  async approveRequest(id: number, data: ApproveRequestData): Promise<any> {
    const response = await this.api.post(`/stock-requests/${id}/approve`, data);
    return response.data || response;
  }

  async getPendingCount(): Promise<number> {
    const response = await this.api.get("/stock-requests/pending-count");
    return response.data?.data?.pending_count || 0;
  }

  // ============ DESPATCH ============
  async getDespatches(params?: {
    outlet_id?: number;
    status?: number;
  }): Promise<any> {
    const response = await this.api.get("/stock-despatches", { params });
    return response.data || response;
  }

  async getDespatch(id: number): Promise<any> {
    const response = await this.api.get(`/stock-despatches/${id}`);
    return response.data || response;
  }

  async createDespatch(data: CreateDespatchData): Promise<any> {
    const response = await this.api.post("/stock-despatches", data);
    return response.data || response;
  }

  // ============ RECEIVE ============
  async getReceives(params?: {
    outlet_id?: number;
    status?: number;
  }): Promise<any> {
    const response = await this.api.get("/stock-receives", { params });
    return response.data || response;
  }

  async getReceive(id: number): Promise<any> {
    const response = await this.api.get(`/stock-receives/${id}`);
    return response.data || response;
  }

  async receiveStock(data: ReceiveStockData): Promise<any> {
    const response = await this.api.post("/stock-receives", data);
    return response.data || response;
  }
}

export default new StockTransferService();
