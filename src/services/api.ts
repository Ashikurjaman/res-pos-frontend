// src/services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8001", // আপনার API URL
  headers: {
    "Content-Type": "application/json",
  },
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
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default api;