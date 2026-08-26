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
    try {
      console.log('📤 Signup request:', data);
      const response = await api.post('/auth/signup', data);
      console.log('📥 Signup response:', response);
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      // If error has response data, return it
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  }

  async signin(data: {
    usernameOrEmail: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      console.log('📤 Signin request:', { usernameOrEmail: data.usernameOrEmail });
      const response = await api.post('/auth/signin', data);
      console.log('📥 Signin response:', response);
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Signin error:', error);
      // If error has response data, throw it
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  }

  async signout(): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/signout');
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Signout error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  }

  async getMe(): Promise<AuthResponse> {
    try {
      const response = await api.get('/auth/me');
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Get me error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/refresh');
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Refresh token error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
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
    try {
      const response = await api.get('/users', { params });
      return response;
    } catch (error: any) {
      console.error('❌ Get users error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  }

  async getUser(id: number): Promise<AuthResponse> {
    try {
      const response = await api.get(`/users/${id}`);
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Get user error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
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
    try {
      const response = await api.post('/users', data);
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Create user error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
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
    try {
      const response = await api.put(`/users/${id}`, data);
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Update user error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  }

  async deleteUser(id: number): Promise<AuthResponse> {
    try {
      const response = await api.delete(`/users/${id}`);
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Delete user error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  }

  async updateUserStatus(id: number, status: 'active' | 'inactive' | 'banned'): Promise<AuthResponse> {
    try {
      const response = await api.put(`/users/${id}/status`, { status });
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Update user status error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  }

  async updateUserRole(id: number, role: 'admin' | 'user'): Promise<AuthResponse> {
    try {
      const response = await api.put(`/users/${id}/role`, { role });
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Update user role error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  }

  async bulkDeleteUsers(ids: number[]): Promise<AuthResponse> {
    try {
      const response = await api.post('/users/bulk-delete', { ids });
      return response as AuthResponse;
    } catch (error: any) {
      console.error('❌ Bulk delete users error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  }
}

export default new AuthService();