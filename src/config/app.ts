// src/config/app.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_CONFIG = {
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const AUTH_ENDPOINTS = {
  SIGNIN: '/api/auth/signin',  // ✅ Added /api/ prefix
  SIGNUP: '/api/auth/signup',  // ✅ Added /api/ prefix
  SIGNOUT: '/api/auth/signout', // ✅ Added /api/ prefix
  ME: '/api/auth/me',          // ✅ Added /api/ prefix
  REFRESH: '/api/auth/refresh', // ✅ Added /api/ prefix
};

export const USER_ENDPOINTS = {
  GET_ALL: '/api/users',
  GET_BY_ID: (id: string) => `/api/users/${id}`,
  CREATE: '/api/users',
  UPDATE: (id: string) => `/api/users/${id}`,
  DELETE: (id: string) => `/api/users/${id}`,
  UPDATE_STATUS: (id: string) => `/api/users/${id}/status`,
};