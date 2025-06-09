"use client";

import { Prisma } from "@prisma/client";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UserContextType = {
  user: string | null;
  fetchUser: () => Promise<string | null>;
  loading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();

  const fetchUser = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/getUser`,
      {
        credentials: "include",
      }
    );
    if (res.ok) {
      const data = await res.json();

      const userEmail = data.user?.email;
      setUser(userEmail);
      setLoading(false);
      return userEmail;
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);
  return (
    <UserContext.Provider
      value={{
        user,
        fetchUser,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};
