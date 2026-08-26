// src/services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  withCredentials: false,
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
  (response) => {
    // Return the full response data
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Handle network errors
    if (error.code === "ERR_NETWORK") {
      console.error("Network error - please check your connection");
      return Promise.reject({
        success: false,
        message: "Network error - please check your connection"
      });
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      window.location.href = "/signin";
      return Promise.reject({
        success: false,
        message: "Session expired. Please login again."
      });
    }
    
    // Handle 422 Validation Error
    if (error.response?.status === 422) {
      return Promise.reject({
        success: false,
        message: "Validation failed",
        errors: error.response.data?.errors
      });
    }
    
    // Handle other errors
    return Promise.reject({
      success: false,
      message: error.response?.data?.message || error.message || "An error occurred",
      status: error.response?.status
    });
  }
);

export default api;