import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, formatApiError } from "./api";

export type User = {
  id: string;
  email: string;
  name: string;
  role: "staff" | "admin";
  employee_id?: string | null;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, employee_id?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          const { data } = await api.get("/auth/me");
          setUser(data);
        }
      } catch {
        await AsyncStorage.removeItem("auth_token");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      await AsyncStorage.setItem("auth_token", data.token);
      setUser(data.user);
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    employee_id?: string
  ) => {
    try {
      const { data } = await api.post("/auth/register", {
        email,
        password,
        name,
        employee_id,
      });
      await AsyncStorage.setItem("auth_token", data.token);
      setUser(data.user);
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("auth_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
