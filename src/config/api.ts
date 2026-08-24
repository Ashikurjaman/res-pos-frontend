// config/app.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export const API_CONFIG = {
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};