// src/services/api.ts
import axios from "axios";
import Swal from "sweetalert2";

// ✅ FIX: no more hardcoded localhost — falls back to it only in dev
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

// ✅ FIX: `metadata` was being set on the request config but never declared,
// which is a type error under strict TS. Augment axios's config type instead
// of relying on an implicit `any`.
declare module "axios" {
  export interface AxiosRequestConfig {
    metadata?: { startTime: number };
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
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
};

export const clearAuthToken = () => {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
  localStorage.removeItem("rememberMe");
  delete api.defaults.headers.common["Authorization"];
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
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  },
);

// ==================== RESPONSE INTERCEPTOR ====================
// NOTE: this interceptor unwraps to response.data, so every caller
// (authService, etc.) receives the API's JSON body directly, not an
// AxiosResponse. That contract is preserved as-is below.

api.interceptors.response.use(
  (response) => {
    if (response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`,
      );
    }
    return response.data;
  },
  (error) => {
    console.error("API Error:", error);

    // ============ NETWORK ERRORS ============
    if (error.code === "ERR_NETWORK") {
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
      const message =
        error.response.data?.message ||
        "Too many requests. Please wait before trying again.";

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

      return Promise.reject({
        success: false,
        message,
        retry_after: retryAfter,
        status: 429,
      });
    }

    // ============ UNAUTHORIZED (401) ============
    if (error.response?.status === 401) {
      clearAuthToken();

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
      const message =
        error.response.data?.message ||
        "You don't have permission to perform this action.";

      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: message,
        confirmButtonColor: "#3b82f6",
      });

      return Promise.reject({
        success: false,
        message,
        status: 403,
      });
    }

    // ============ VALIDATION ERROR (422) ============
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors || {};
      const firstError = Object.values(errors).flat()[0];
      if (firstError) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: firstError as string,
          confirmButtonColor: "#3b82f6",
        });
      }

      return Promise.reject({
        success: false,
        message: "Validation failed",
        errors,
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
        message,
        status: 404,
      });
    }

    // ============ SERVER ERROR (500) ============
    if (error.response?.status === 500) {
      // ✅ FIX: surface the backend's actual message/error instead of a
      // fixed generic string — several controllers (e.g. OutletReceiveController)
      // deliberately return `error: $e->getMessage()` for exactly this reason,
      // and it was being discarded here.
      const backendMessage =
        error.response.data?.error ||
        error.response.data?.message ||
        "Something went wrong on the server. Please try again later.";

      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: backendMessage,
        confirmButtonColor: "#3b82f6",
      });

      return Promise.reject({
        success: false,
        message: backendMessage,
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
  },
);

// ==================== RATE LIMIT HELPERS ====================

export const exponentialBackoff = async (
  retryCount: number,
  maxRetries: number = 3,
): Promise<void> => {
  if (retryCount >= maxRetries) {
    throw new Error("Max retries exceeded");
  }
  const delay = Math.pow(2, retryCount) * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
};

export const isRateLimitError = (error: any): boolean => {
  return error?.status === 429 || error?.response?.status === 429;
};

export const getRetryAfter = (error: any): number => {
  return error?.retry_after || error?.response?.data?.retry_after || 60;
};

export const makeRequestWithRetry = async (
  requestFn: () => Promise<any>,
  maxRetries: number = 3,
): Promise<any> => {
  let lastError: any;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      if (!isRateLimitError(error)) {
        throw error;
      }
      attempt++;
      if (attempt < maxRetries) {
        const retryAfter = getRetryAfter(error);
        await exponentialBackoff(attempt);
      }
    }
  }

  throw lastError;
};

export default api;
