import { useEffect, useState } from "react";
import { searchGuardians, type GuardianLite } from "@/lib/api/client/guardian";
import { useDebounced } from "./useDebounced";

export function useGuardianSearch(query: string, minLength = 1) {
  const trimmed = query.trim();
  const debouncedQuery = useDebounced(trimmed, 300);
  const [results, setResults] = useState<GuardianLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (debouncedQuery.length < minLength) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancel = false;
    setLoading(true);
    searchGuardians(debouncedQuery)
      .then((items) => {
        if (!cancel) setResults(items);
      })
      .catch((e: unknown) => {
        if (!cancel) {
          setError(e instanceof Error ? e.message : "Failed to search guardians");
        }
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });

    return () => {
      cancel = true;
    };
  }, [debouncedQuery, minLength]);

  const active = trimmed.length >= minLength;
  return {
    results: active ? results : [],
    loading: active && loading,
    error: active ? error : null,
    debouncedQuery: active ? debouncedQuery : "",
  };
}
