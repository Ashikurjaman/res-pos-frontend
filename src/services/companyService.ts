// src/services/CompanyService.ts
import { BaseService } from "./BaseService";

export interface Company {
  id: number;
  company_name: string;
  outlet_name: string;
  address: string;
  contact_no: string;
  email: string | null;
  slogan: string;
  pay_type: number;
  validity: boolean;
  created_at: string;
  updated_at: string;
}

class CompanyService extends BaseService {
  constructor() {
    super("companies");
  }

  async getActive(): Promise<Company[]> {
    return this.api.get(`${this.endpoint}/active`);
  }
}

export default new CompanyService();