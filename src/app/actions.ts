"use server";

import { getFilteredSessions, getSessionDetail } from "@/lib/database/queries";
import type {
  SessionFilterOptions,
  SessionsPaginatedResult,
  SessionDetail,
} from "@/lib/database/types";

export async function fetchSessionsAction(
  filters: SessionFilterOptions
): Promise<SessionsPaginatedResult> {
  return await getFilteredSessions(filters);
}

export async function fetchSessionDetailAction(
  sessionId: number
): Promise<SessionDetail | null> {
  return await getSessionDetail(sessionId);
}
