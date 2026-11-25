"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCommunicationDetails,
  isSendInProgress,
} from "@/lib/api/client/communications";

const POLL_MS = 2000;

export function useCommunicationDetails(logId: string | null | undefined) {
  return useQuery({
    queryKey: ["communication", logId],
    queryFn: () => getCommunicationDetails(logId as string),
    enabled: Boolean(logId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (query.state.error) return false;
      return !status || isSendInProgress(status) ? POLL_MS : false;
    },
  });
}
