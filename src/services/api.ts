// src/services/api.ts
import axios from "axios";
import Swal from "sweetalert2";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
  timeout: 30000, // 30 seconds timeout
});

// ==================== TOKEN MANAGEMENT ====================

export const setAuthToken = (token: string, rememberMe: boolean = false) => {
  if (rememberMe) {
    localStorage.setItem("authToken", token);
    localStorage.setItem("rememberMe", "true");
  } else {
    sessionStorage.setItem("authToken", token);
    localStorage.removeItem("rememberMe");
  }
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  console.log("✅ Auth token set");
};

export const clearAuthToken = () => {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
  localStorage.removeItem("rememberMe");
  delete api.defaults.headers.common["Authorization"];
  console.log("✅ Auth token cleared");
};

export const getAuthToken = () => {
  return (
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
  );
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

// ==================== REQUEST INTERCEPTOR ====================

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: Date.now() };

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================

api.interceptors.response.use(
  (response) => {
    // Log response time for debugging
    if (response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    return response.data;
  },
  (error) => {
    console.error("API Error:", error);

    // ============ NETWORK ERRORS ============
    if (error.code === "ERR_NETWORK") {
      console.error("Network error - please check your connection");
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Please check your internet connection.",
        confirmButtonColor: "#3b82f6",
      });
      return Promise.reject({
        success: false,
        message: "Network error - please check your connection",
      });
    }

    // ============ REQUEST TIMEOUT ============
    if (error.code === "ECONNABORTED") {
      Swal.fire({
        icon: "error",
        title: "Request Timeout",
        text: "The request took too long to complete. Please try again.",
        confirmButtonColor: "#3b82f6",
      });
      return Promise.reject({
        success: false,
        message: "Request timeout - please try again",
      });
    }

    // ============ RATE LIMITING (429) ============
    if (error.response?.status === 429) {
      const retryAfter = error.response.data?.retry_after || 60;
      const message = error.response.data?.message || "Too many requests. Please wait before trying again.";

      console.warn(`⏳ Rate limit exceeded. Retry after ${retryAfter} seconds`);

      // Show SweetAlert with timer
      Swal.fire({
        icon: "warning",
        title: "Too Many Requests",
        text: message,
        timer: retryAfter * 1000,
        timerProgressBar: true,
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "OK",
        showConfirmButton: true,
      });

      // You can also implement exponential backoff here
      return Promise.reject({
        success: false,
        message: message,
        retry_after: retryAfter,
        status: 429,
      });
    }

    // ============ UNAUTHORIZED (401) ============
    if (error.response?.status === 401) {
      console.error("Unauthorized - Token may be expired");
      clearAuthToken();

      // Don't redirect if already on login page
      const publicPaths = ["/signin", "/signup", "/login", "/register"];
      if (
        !publicPaths.includes(window.location.pathname) &&
        !window.location.pathname.includes("/auth")
      ) {
        Swal.fire({
          icon: "warning",
          title: "Session Expired",
          text: "Your session has expired. Please login again.",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          window.location.href = "/signin";
        });
      }

      return Promise.reject({
        success: false,
        message: "Session expired. Please login again.",
        status: 401,
      });
    }

    // ============ FORBIDDEN (403) ============
    if (error.response?.status === 403) {
      const message = error.response.data?.message || "You don't have permission to perform this action.";

      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: message,
        confirmButtonColor: "#3b82f6",
      });

      return Promise.reject({
        success: false,
        message: message,
        status: 403,
      });
    }

    // ============ VALIDATION ERROR (422) ============
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors || {};

      // Show first validation error
      const firstError = Object.values(errors).flat()[0];
      if (firstError) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: firstError,
          confirmButtonColor: "#3b82f6",
        });
      }

      return Promise.reject({
        success: false,
        message: "Validation failed",
        errors: errors,
        status: 422,
      });
    }

    // ============ NOT FOUND (404) ============
    if (error.response?.status === 404) {
      const message = error.response.data?.message || "Resource not found.";

      Swal.fire({
        icon: "error",
        title: "Not Found",
        text: message,
        confirmButtonColor: "#3b82f6",
      });

      return Promise.reject({
        success: false,
        message: message,
        status: 404,
      });
    }

    // ============ SERVER ERROR (500) ============
    if (error.response?.status === 500) {
      console.error("Server Error:", error.response.data);

      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong on the server. Please try again later.",
        confirmButtonColor: "#3b82f6",
      });

      return Promise.reject({
        success: false,
        message: "Server error. Please try again later.",
        status: 500,
      });
    }

    // ============ OTHER ERRORS ============
    return Promise.reject({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred",
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// ==================== HELPER FUNCTIONS FOR RATE LIMITING ====================

// Exponential backoff for retries
export const exponentialBackoff = async (retryCount: number, maxRetries: number = 3): Promise<void> => {
  if (retryCount >= maxRetries) {
    throw new Error('Max retries exceeded');
  }

  const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
  await new Promise(resolve => setTimeout(resolve, delay));
};

// Check if error is rate limit error
export const isRateLimitError = (error: any): boolean => {
  return error?.status === 429 || error?.response?.status === 429;
};

// Get retry after from error
export const getRetryAfter = (error: any): number => {
  return error?.retry_after || error?.response?.data?.retry_after || 60;
};

// ==================== RATE LIMIT AWARE REQUEST FUNCTION ====================

export const makeRequestWithRetry = async (
  requestFn: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> => {
  let lastError: any;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      // Only retry on rate limit errors
      if (!isRateLimitError(error)) {
        throw error;
      }

      attempt++;

      if (attempt < maxRetries) {
        const retryAfter = getRetryAfter(error);
        console.warn(`⏳ Rate limited. Retry ${attempt}/${maxRetries} after ${retryAfter} seconds`);
        await exponentialBackoff(attempt);
      }
    }
  }

  throw lastError;
};

// ==================== EXPORT ====================

export default api;
