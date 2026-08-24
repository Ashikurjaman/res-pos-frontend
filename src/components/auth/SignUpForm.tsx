// src/hooks/useAuth.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "../../config/api";

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
}

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
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async ({
    usernameOrEmail,
    password,
    rememberMe,
  }: {
    usernameOrEmail: string;
    password: string;
    rememberMe: boolean;
  }) => {
    try {
      const response = await api.post("/auth/signin", {
        usernameOrEmail,
        password,
      });

      const { token, user: userData } = response.data;

      if (rememberMe) {
        localStorage.setItem("authToken", token);
      } else {
        sessionStorage.setItem("authToken", token);
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to sign in");
    }
  };

  const signOut = async () => {
    try {
      await api.post("/auth/signout");
    } catch (error) {
      // Ignore errors on signout
    } finally {
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
  };

  const signUp = async (data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post("/auth/signup", data);
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
