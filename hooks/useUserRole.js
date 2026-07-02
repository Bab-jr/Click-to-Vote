import { useAuth } from "@/lib/AuthContext";

export function useUserRole() {
  const { user } = useAuth();
  return { effectiveRole: user?.role || null, loading: false };
}