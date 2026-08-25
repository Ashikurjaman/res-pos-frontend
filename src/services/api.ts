// src/services/api.ts
import axios from "axios";
import { API_CONFIG } from "../config/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.baseURL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  // Important for CORS
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle CORS errors
    if (error.code === "ERR_NETWORK") {
      console.error("Network error - CORS or connection issue:", error);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default api;