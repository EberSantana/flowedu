import { trpc } from "@/lib/trpc";

export type UserProfile = "traditional" | "enthusiast" | "interactive" | "organizational";

export function useUserProfile() {
  const { data, isLoading, refetch } = trpc.userProfile.getProfile.useQuery();
  
  return {
    profile: data?.profile as UserProfile | undefined,
    isLoading,
    refetch,
  };
}
