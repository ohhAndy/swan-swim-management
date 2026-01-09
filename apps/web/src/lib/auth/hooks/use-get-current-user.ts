import { useEffect, useState } from "react";
import { CurrentUser, getCurrentUserClient } from "@/lib/auth/user-client";

export function useGetCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUserClient().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}
