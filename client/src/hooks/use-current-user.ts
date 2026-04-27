import { useQuery } from "@tanstack/react-query";
import type { PublicUser } from "@shared/schema";

export function useCurrentUser() {
  return useQuery<PublicUser | null>({
    queryKey: ["/api/user/current"],
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
