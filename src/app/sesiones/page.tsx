import {
  getGlobalMetrics,
  getAvailableClubs,
  getFilteredSessions,
} from "@/lib/database/queries";
import { DashboardView } from "@/components/dashboard-view";
import type { SessionsPaginatedResult } from "@/lib/database/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL?.trim());

  let metrics = null;
  let clubs: Awaited<ReturnType<typeof getAvailableClubs>> = [];
  let sessionsResult: SessionsPaginatedResult = {
    sessions: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  };
  let isConnected = false;

  if (hasDbUrl) {
    try {
      const [m, c, s] = await Promise.all([
        getGlobalMetrics(),
        getAvailableClubs(),
        getFilteredSessions({ page: 1, pageSize: 20 }),
      ]);
      if (m) {
        metrics = m;
        clubs = c;
        sessionsResult = s;
        isConnected = true;
      }
    } catch {
      isConnected = false;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardView
        initialMetrics={metrics}
        initialClubs={clubs}
        initialSessionsResult={sessionsResult}
        isConnected={isConnected}
      />
    </div>
  );
}
