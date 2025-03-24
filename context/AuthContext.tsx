"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

interface User {
  id: number;
  documentId: number;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    const userData = Cookies.get("user");

    if (token && userData) {
      setIsAuthenticated(true);
      setToken(token);
      setUser(JSON.parse(userData));
    }
  }, [isAuthenticated]);

  // Xử lý login: Gọi API và lưu token vào cookies
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post(`${API_URL}/api/auth/local`, {
        identifier: email,
        password,
      });

      const { jwt, user } = response.data;
      Cookies.set("token", jwt, { expires: 7 });
      Cookies.set("user", JSON.stringify(user), { expires: 7 });

      setIsAuthenticated(true);
      setUser(user);
      setToken(jwt);
      router.push("/");
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || "Login failed");
    }
  };

  // Xử lý logout
  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    setIsAuthenticated(false);
    setToken("");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
