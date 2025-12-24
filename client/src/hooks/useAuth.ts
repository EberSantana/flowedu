import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  
  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
  };
}

export function getLoginUrl() {
  const currentPath = window.location.pathname + window.location.search;
  return `/api/oauth/login?redirect=${encodeURIComponent(currentPath)}`;
}
