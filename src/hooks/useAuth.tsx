// src/hooks/useAuth.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import Swal from "sweetalert2";
import AuthService, { User } from "../services/authService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: {
    usernameOrEmail: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (data: {
    username: string;
    email?: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate(); // ✅ Initialize navigate

  const checkAuth = useCallback(async () => {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await AuthService.getMe();
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        localStorage.removeItem("authToken");
        sessionStorage.removeItem("authToken");
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signIn = useCallback(
    async ({
      usernameOrEmail,
      password,
      rememberMe,
    }: {
      usernameOrEmail: string;
      password: string;
      rememberMe: boolean;
    }) => {
      try {
        const response = await AuthService.signin({
          usernameOrEmail,
          password,
        });

        if (response.success && response.token && response.user) {
          if (rememberMe) {
            localStorage.setItem("authToken", response.token);
            localStorage.setItem("rememberMe", "true");
          } else {
            sessionStorage.setItem("authToken", response.token);
            localStorage.removeItem("rememberMe");
          }

          setUser(response.user);

          Swal.fire({
            icon: "success",
            title: "Welcome!",
            text: `Welcome back ${response.user.first_name}!`,
            timer: 2000,
            showConfirmButton: false,
            position: "top-end",
            toast: true,
          });

          navigate("/dashboard");
        } else {
          throw new Error(response.message || "Failed to sign in");
        }
      } catch (error: any) {
        console.error("Sign in failed:", error);

        let errorMessage =
          error.message || "Invalid credentials. Please try again.";

        Swal.fire({
          icon: "error",
          title: "Sign In Failed!",
          text: errorMessage,
          confirmButtonColor: "#3b82f6",
        });
        throw error;
      }
    },
    [navigate],
  );

  const signOut = useCallback(async () => {
    try {
      await AuthService.signout();
    } catch (error) {
      console.warn("Sign out error (ignored):", error);
    } finally {
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("rememberMe");
      setUser(null);
      navigate("/signin"); // ✅ Navigate to signin on signout
    }
  }, [navigate]);

  const signUp = useCallback(
    async (data: {
      username: string;
      email?: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      try {
        console.log("📤 Signup request:", data);
        const response = await AuthService.signup(data);
        console.log("📥 Signup response:", response);

        if (response.success && response.token && response.user) {
          // Store token (optional - if you want auto-login)
          localStorage.setItem("authToken", response.token);
          setUser(response.user);

          // ✅ Show success message with OK button
          await Swal.fire({
            icon: "success",
            title: "Account Created! 🎉",
            text: "Your account has been created successfully! Please sign in.",
            confirmButtonColor: "#3b82f6",
            confirmButtonText: "Sign In",
            timer: 3000,
            timerProgressBar: true,
          });

          // ✅ Navigate to signin after success
          navigate("/signin");

          return response.user;
        } else {
          throw new Error(response.message || "Failed to sign up");
        }
      } catch (error: any) {
        console.error("❌ Sign up failed:", error);

        let errorMessage = "Failed to create account. Please try again.";

        if (error.response?.data?.errors) {
          const errors = Object.values(error.response.data.errors).flat();
          errorMessage = errors.join(", ");
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        Swal.fire({
          icon: "error",
          title: "Sign Up Failed!",
          text: errorMessage,
          confirmButtonColor: "#3b82f6",
        });
        throw error;
      }
    },
    [navigate], // ✅ Add navigate to dependencies
  );

  const refreshUser = useCallback(async () => {
    try {
      const response = await AuthService.getMe();
      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const hasRole = useCallback(
    (roles: string | string[]): boolean => {
      if (!user) return false;
      const roleList = Array.isArray(roles) ? roles : [roles];
      return roleList.includes(user.role);
    },
    [user],
  );

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    signUp,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export { AuthContext };
