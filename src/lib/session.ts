import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "manager" | "contributor" | "viewer";

export const ROLE_LABEL: Record<AppRole, string> = {
  owner: "Owner",
  manager: "Manager",
  contributor: "Contributor",
  viewer: "Viewer",
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("formiva_demo") === "1") {
      setUser({ id: "demo-owner", email: sessionStorage.getItem("formiva_demo_email") ?? "admin@formiva.local" } as User);
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export function useRole() {
  const { user, loading } = useUser();
  const demo = typeof window !== "undefined" && sessionStorage.getItem("formiva_demo") === "1";
  const query = useQuery({
    queryKey: ["my-role", user?.id],
    enabled: !!user && !demo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as AppRole);
      const order: AppRole[] = ["owner", "manager", "contributor", "viewer"];
      return order.find((r) => roles.includes(r)) ?? "viewer";
    },
  });

  const role = (demo ? "owner" : query.data ?? null) as AppRole | null;
  return {
    user,
    role,
    loading: loading || query.isLoading,
    isOwner: role === "owner",
    canManage: role === "owner" || role === "manager",
    canWrite: role === "owner" || role === "manager" || role === "contributor",
  };
}
