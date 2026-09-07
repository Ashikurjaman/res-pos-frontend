// src/services/authService.ts
import api from "./api";

export interface User {
  id: number;
  username: string;
  email: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string; // Spatie: first assigned role name (dynamic, not a fixed enum)
  roles: string[]; // all assigned roles
  status: "active" | "inactive" | "banned";
  status_label: string;
  outlet_id: number | null;
  outlet?: {
    id: number;
    outlet_name: string;
    outlet_code: string;
  } | null;
  permissions: string[]; // array of permission names (role + direct)
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

// Known roles for color-coding only — NOT an exhaustive list.
// Spatie roles are managed in the DB and can be created/renamed at any time,
// so this must never be used to validate or restrict what a role can be.
export const KNOWN_ROLE_COLORS: Record<string, string> = {
  superadmin:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  author:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  store: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  kitchen:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  cashier: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  manager: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  user: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

export const DEFAULT_ROLE_COLOR =
  "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

// ✅ FIX: handles snake_case / hyphenated role names too, not just a bare capitalize
export const formatRoleLabel = (role?: string | null) => {
  if (!role) return "";
  return role
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

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
      return (await api.post("/auth/signup", data)) as AuthResponse;
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
      return (await api.post("/auth/signin", data)) as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async signout(): Promise<AuthResponse> {
    try {
      return (await api.post("/auth/signout")) as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async getMe(): Promise<AuthResponse> {
    try {
      return (await api.get("/auth/me")) as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      return (await api.post("/auth/refresh")) as AuthResponse;
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
      return await api.get("/users", { params });
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async getUser(id: number): Promise<AuthResponse> {
    try {
      return (await api.get(`/users/${id}`)) as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  // NOTE: store()/update() on the backend expect snake_case first_name/last_name
  // — this is intentionally different from signup()'s camelCase firstName/lastName.
  async createUser(data: {
    username: string;
    email?: string | null;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    status?: Status;
    outlet_id?: number | null;
    permissions?: string[];
  }): Promise<AuthResponse> {
    try {
      const requestData = {
        ...data,
        email: data.email ?? null,
        outlet_id: data.outlet_id ?? null,
      };
      return (await api.post("/users", requestData)) as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async updateUser(
    id: number,
    data: {
      username?: string;
      email?: string | null;
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
      const requestData = {
        ...data,
        email: data.email !== undefined ? data.email : undefined,
        outlet_id: data.outlet_id !== undefined ? data.outlet_id : undefined,
      };
      return (await api.put(`/users/${id}`, requestData)) as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async deleteUser(id: number): Promise<AuthResponse> {
    try {
      return (await api.delete(`/users/${id}`)) as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async updateUserStatus(id: number, status: Status): Promise<AuthResponse> {
    try {
      return (await api.put(`/users/${id}/status`, {
        status,
      })) as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async updateUserRole(id: number, role: string): Promise<AuthResponse> {
    try {
      return (await api.put(`/users/${id}/role`, { role })) as AuthResponse;
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
      return (await api.put(`/users/${id}/permissions`, {
        permissions,
      })) as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }

  async bulkDeleteUsers(ids: number[]): Promise<AuthResponse> {
    try {
      return (await api.post("/users/bulk-delete", { ids })) as AuthResponse;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  }
}

export default new AuthService();
