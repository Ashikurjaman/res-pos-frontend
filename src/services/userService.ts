// services/userService.ts
import { USER_ENDPOINTS } from '../config/api';
import api from './api';


export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  avatar?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive' | 'pending';
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive' | 'pending';
  password?: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class UserService {
  // CREATE - Add new user
  async createUser(data: CreateUserData): Promise<User> {
    const response = await api.post(USER_ENDPOINTS.CREATE, data);
    return response.data;
  }

  // READ - Get all users with pagination
  async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    const response = await api.get(USER_ENDPOINTS.GET_ALL, { params });
    return response.data;
  }

  // READ - Get single user by ID
  async getUserById(id: string): Promise<User> {
    const response = await api.get(USER_ENDPOINTS.GET_BY_ID(id));
    return response.data;
  }

  // UPDATE - Update user
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.put(USER_ENDPOINTS.UPDATE(id), data);
    return response.data;
  }

  // DELETE - Delete user
  async deleteUser(id: string): Promise<void> {
    await api.delete(USER_ENDPOINTS.DELETE(id));
  }

  // UPDATE - Change user status
  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'pending'): Promise<User> {
    const response = await api.patch(USER_ENDPOINTS.UPDATE_STATUS(id), { status });
    return response.data;
  }

  // UPDATE - Bulk update users
  async bulkUpdateUsers(ids: string[], data: Partial<UpdateUserData>): Promise<User[]> {
    const response = await api.patch('/users/bulk', { ids, ...data });
    return response.data;
  }

  // DELETE - Bulk delete users
  async bulkDeleteUsers(ids: string[]): Promise<void> {
    await api.delete('/users/bulk', { data: { ids } });
  }
}

export default new UserService();