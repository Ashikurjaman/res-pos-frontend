// src/services/authService.ts
import api from './api';

export interface User {
  id: number;
  username: string;
  email: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'banned';
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

class AuthService {
  // ==================== AUTHENTICATION ====================
  
  async signup(data: {
    username: string;
    email?: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> {
    const response = await api.post('/auth/signup', data);
    return response.data;
  }

  async signin(data: {
    usernameOrEmail: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await api.post('/auth/signin', data);
    return response.data;
  }

  async signout(): Promise<AuthResponse> {
    const response = await api.post('/auth/signout');
    return response.data;
  }

  async getMe(): Promise<AuthResponse> {
    const response = await api.get('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh');
    return response.data;
  }

  // ==================== USER MANAGEMENT (CRUD) ====================

  async getUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<any> {
    const response = await api.get('/users', { params });
    return response.data;
  }

  async getUser(id: number): Promise<AuthResponse> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  async createUser(data: {
    username: string;
    email?: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: 'admin' | 'user';
    status?: 'active' | 'inactive' | 'banned';
  }): Promise<AuthResponse> {
    const response = await api.post('/users', data);
    return response.data;
  }

  async updateUser(id: number, data: {
    username?: string;
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    role?: 'admin' | 'user';
    status?: 'active' | 'inactive' | 'banned';
  }): Promise<AuthResponse> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: number): Promise<AuthResponse> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }

  async updateUserStatus(id: number, status: 'active' | 'inactive' | 'banned'): Promise<AuthResponse> {
    const response = await api.put(`/users/${id}/status`, { status });
    return response.data;
  }

  async updateUserRole(id: number, role: 'admin' | 'user'): Promise<AuthResponse> {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  }

  async bulkDeleteUsers(ids: number[]): Promise<AuthResponse> {
    const response = await api.post('/users/bulk-delete', { ids });
    return response.data;
  }
}

export default new AuthService();