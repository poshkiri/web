"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types";

export function useUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, avatar_url, role, bio, website, stripe_account_id, created_at")
      .eq("id", userId)
      .single();

    if (error) {
      setUser(null);
      return;
    }
    setUser(data as User);
  }, []);

  const syncSession = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    const supabase = createClient();

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, syncSession]);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  }, [router]);

  const isAuthenticated = user !== null;
  const isSeller = user?.role === "seller";
  const isAdmin = user?.role === "admin";

  return {
    user,
    loading,
    isAuthenticated,
    isSeller,
    isAdmin,
    logout,
  };
}
