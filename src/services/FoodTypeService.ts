// src/services/FoodTypeService.ts
import { BaseService } from "./BaseService";
import { FoodType, FoodTypeFormData } from "../types/foodType";

class FoodTypeService extends BaseService {
  constructor() {
    super("food-types");
  }

  async getActive(): Promise<FoodType[]> {
    return this.api.get(`${this.endpoint}/active`);
  }

  async toggleOnline(id: number): Promise<FoodType> {
    return this.api.post(`${this.endpoint}/${id}/toggle`);
  }

  async restore(id: number): Promise<FoodType> {
    return this.api.post(`${this.endpoint}/${id}/restore`);
  }

  async create(data: FoodTypeFormData): Promise<FoodType> {
    return this.api.post(this.endpoint, data);
  }

  async update(id: number, data: Partial<FoodTypeFormData>): Promise<FoodType> {
    return this.api.put(`${this.endpoint}/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }
}

export default new FoodTypeService();
