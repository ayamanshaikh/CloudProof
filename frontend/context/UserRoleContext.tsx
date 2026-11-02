"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "student" | "teacher";

interface UserRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isTeacher: boolean;
  isStudent: boolean;
}

const UserRoleContext = createContext<UserRoleContextType>({
  role: "student",
  setRole: () => {},
  isTeacher: false,
  isStudent: true,
});

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("student");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cloudproof_active_role");
      if (saved === "teacher" || saved === "student") {
        setRoleState(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem("cloudproof_active_role", newRole);
    } catch {
      // Ignore
    }
  };

  return (
    <UserRoleContext.Provider
      value={{
        role,
        setRole,
        isTeacher: role === "teacher",
        isStudent: role === "student",
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export const useUserRole = () => useContext(UserRoleContext);
