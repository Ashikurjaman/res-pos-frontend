// src/hooks/useAuth.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import api from "../services/api";
import authService, { User } from "../services/authService";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await authService.getMe();

      if (response.success && response.user) {
        setUser(response.user);
      } else {
        throw new Error("Failed to get user");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      delete api.defaults.headers.common["Authorization"];
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
        const response = await authService.signin({
          usernameOrEmail,
          password,
        });

        if (!response.success) {
          throw new Error(response.message);
        }

        const { token, user: userData } = response;

        if (rememberMe) {
          localStorage.setItem("authToken", token!);
        } else {
          sessionStorage.setItem("authToken", token!);
        }

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData!);
      } catch (error: any) {
        console.error("Sign in failed:", error);
        throw new Error(error.message || "Failed to sign in");
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await authService.signout();
    } catch (error) {
      console.warn("Sign out error (ignored):", error);
    } finally {
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
  }, []);

  const signUp = useCallback(
    async (data: {
      username: string;
      email?: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      try {
        const response = await authService.signup(data);

        if (!response.success) {
          throw new Error(response.message);
        }

        // Auto sign in after signup
        const { token, user: userData } = response;

        if (token) {
          localStorage.setItem("authToken", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          setUser(userData!);
        }

        return response;
      } catch (error: any) {
        console.error("Sign up failed:", error);
        throw new Error(error.message || "Failed to sign up");
      }
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getMe();
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

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    signUp,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
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
