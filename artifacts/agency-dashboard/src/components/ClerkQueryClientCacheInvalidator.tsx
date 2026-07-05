import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";

export function ClerkQueryClientCacheInvalidator() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    // When the user changes (login/logout/switch), clear all cached queries
    // so data from the previous user isn't shown
    queryClient.clear();
  }, [userId, queryClient]);

  return null;
}
