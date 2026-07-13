import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchCurrentAdminProfile } from "../lib/roomsApi";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | signed-out | signed-in | forbidden

  async function refreshProfile() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setProfile(null);
      setStatus("signed-out");
      return;
    }

    const adminProfile = await fetchCurrentAdminProfile();
    if (!adminProfile) {
      // Signed in with Supabase Auth, but not a recognised/active admin.
      setProfile(null);
      setStatus("forbidden");
      return;
    }

    setProfile(adminProfile);
    setStatus("signed-in");
  }

  useEffect(() => {
    refreshProfile();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refreshProfile();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AdminAuthContext.Provider value={{ profile, status, refreshProfile }}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export function hasRole(profile, allowedRoles) {
  if (!profile) return false;
  return allowedRoles.includes(profile.role);
}
