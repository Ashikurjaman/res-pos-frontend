// src/services/authService.ts
import api from "./api";

export interface User {
  id: number;
  username: string;
  email: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string; // dynamic — first role name (e.g. "admin", "cashier")
  roles: string[]; // all assigned roles
  status: "active" | "inactive" | "banned";
  status_label: string;
  outlet_id: number | null;
  outlet?: {
    id: number;
    outlet_name: string;
    outlet_code: string;
  } | null;
  permissions: string[]; // ⚠️ now array of permission names, NOT Record<string, boolean>
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  data?: any;
}

export const STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BANNED: "banned",
} as const;

export type Status = (typeof STATUSES)[keyof typeof STATUSES];

export const STATUS_LABELS: Record<Status, string> = {
  active: "Active",
  inactive: "Inactive",
  banned: "Banned",
};

// ✅ ADD THESE EXPORTS:
export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  AUTHOR: "author",
  STORE: "store",
  KITCHEN: "kitchen",
  USER: "user",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  author: "Author",
  store: "Store",
  kitchen: "Kitchen",
  user: "User",
};

// Helper: capitalize any dynamic role name for display
export const formatRoleLabel = (role: string) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

// Helper: capitalize any dynamic role name for display

class AuthService {
  // ==================== AUTHENTICATION ====================

  async signup(data: {
    username: string;
    email?: string;
    password: string;
    firstName: string;
    lastName: string;
    outlet_id?: number;
    role?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/signup", data);
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async signin(data: {
    usernameOrEmail: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/signin", data);
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async signout(): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/signout");
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async getMe(): Promise<AuthResponse> {
    try {
      const response = await api.get("/auth/me");
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/refresh");
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  // ==================== USER MANAGEMENT (CRUD) ====================

  async getUsers(params?: {
    search?: string;
    role?: string;
    status?: Status;
    outlet_id?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
    per_page?: number;
    page?: number;
  }): Promise<any> {
    try {
      const response = await api.get("/users", { params });
      return response;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async getUser(id: number): Promise<AuthResponse> {
    try {
      const response = await api.get(`/users/${id}`);
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  // src/services/authService.ts

  async createUser(data: {
    username: string;
    email?: string | null; // ✅ Allow null
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    status?: Status;
    outlet_id?: number | null;
    permissions?: string[];
  }): Promise<AuthResponse> {
    try {
      // ✅ Ensure email is always sent, even if null
      const requestData = {
        ...data,
        email: data.email !== undefined ? data.email : null,
        outlet_id: data.outlet_id !== undefined ? data.outlet_id : null,
      };

      const response = await api.post("/users", requestData);
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async updateUser(
    id: number,
    data: {
      username?: string;
      email?: string | null; // ✅ Allow null
      password?: string;
      first_name?: string;
      last_name?: string;
      role?: string;
      status?: Status;
      outlet_id?: number | null;
      permissions?: string[];
    },
  ): Promise<AuthResponse> {
    try {
      // ✅ Ensure email is always sent, even if null
      const requestData = {
        ...data,
        email: data.email !== undefined ? data.email : null,
        outlet_id: data.outlet_id !== undefined ? data.outlet_id : null,
      };

      const response = await api.put(`/users/${id}`, requestData);
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async deleteUser(id: number): Promise<AuthResponse> {
    try {
      const response = await api.delete(`/users/${id}`);
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async updateUserStatus(id: number, status: Status): Promise<AuthResponse> {
    try {
      const response = await api.put(`/users/${id}/status`, { status });
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async updateUserRole(id: number, role: string): Promise<AuthResponse> {
    try {
      const response = await api.put(`/users/${id}/role`, { role });
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async updateUserPermissions(
    id: number,
    permissions: string[],
  ): Promise<AuthResponse> {
    try {
      const response = await api.put(`/users/${id}/permissions`, {
        permissions,
      });
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async bulkDeleteUsers(ids: number[]): Promise<AuthResponse> {
    try {
      const response = await api.post("/users/bulk-delete", { ids });
      return response as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }
}

export default new AuthService();
