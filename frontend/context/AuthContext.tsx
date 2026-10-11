"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: "student" | "instructor") => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isInstructor: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for existing session token
    const storedToken = localStorage.getItem("cp_token");
    if (storedToken) {
      setToken(storedToken);
      api.getMe()
        .then((fetchedUser) => {
          setUser(fetchedUser);
        })
        .catch(() => {
          localStorage.removeItem("cp_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.login({ email, password });
      localStorage.setItem("cp_token", response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      if (response.user.role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string, role: "student" | "instructor") => {
    setIsLoading(true);
    try {
      const response = await api.register({ email, password, full_name: fullName, role });
      localStorage.setItem("cp_token", response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      if (response.user.role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("cp_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isInstructor: user?.role === "instructor",
        isStudent: user?.role === "student",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
