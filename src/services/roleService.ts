// src/services/roleService.ts
import api from "./api";

export interface RolePermission {
  id: number;
  name: string;
}

export interface RoleData {
  id: number;
  name: string;
  users_count: number;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface RoleResponse {
  success: boolean;
  message?: string;
  data?: any;
}

class RoleService {
  async getRoles(params?: {
    search?: string;
    per_page?: number;
    page?: number;
  }) {
    try {
      const response = await api.get("/roles", { params });
      return response as RoleResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async getRole(id: number) {
    try {
      const response = await api.get(`/roles/${id}`);
      return response as RoleResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  // Grouped permissions: { dashboard: [{id,name}], users: [{id,name}], ... }
  // In roleService.ts, change the getPermissionsList method:
  async getPermissionsList() {
    try {
      // Try both endpoints
      let response;
      try {
        response = await api.get("/permissions");
      } catch {
        // Fallback to roles/permissions-list
        response = await api.get("/roles/permissions-list");
      }
      return response as RoleResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async createRole(data: { name: string; permissions?: string[] }) {
    try {
      const response = await api.post("/roles", data);
      return response as RoleResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async updateRole(
    id: number,
    data: { name?: string; permissions?: string[] },
  ) {
    try {
      const response = await api.put(`/roles/${id}`, data);
      return response as RoleResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async deleteRole(id: number) {
    try {
      const response = await api.delete(`/roles/${id}`);
      return response as RoleResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }
}

export default new RoleService();
