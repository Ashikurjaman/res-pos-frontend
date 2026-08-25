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
  SIGNIN: '/auth/signin',
  SIGNUP: '/auth/signup',
  SIGNOUT: '/auth/signout',
  ME: '/auth/me',
  REFRESH: '/auth/refresh',
};

export const USER_ENDPOINTS = {
  GET_ALL: '/users',
  GET_BY_ID: (id: string) => `/users/${id}`,
  CREATE: '/users',
  UPDATE: (id: string) => `/users/${id}`,
  DELETE: (id: string) => `/users/${id}`,
  UPDATE_STATUS: (id: string) => `/users/${id}/status`,
};