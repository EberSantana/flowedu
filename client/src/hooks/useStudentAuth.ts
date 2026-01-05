import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function useStudentAuth() {
  const [, setLocation] = useLocation();
  const { data: student, isLoading, error } = trpc.student.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity, // Nunca considerar dados como obsoletos
  });
  const logoutMutation = trpc.student.logout.useMutation({
    onSuccess: () => {
      setLocation("/student-login");
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    student,
    loading: isLoading,
    error,
    logout,
    isAuthenticated: !!student,
  };
}
