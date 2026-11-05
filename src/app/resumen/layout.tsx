import { getAnalyticsMetadata } from "@/lib/database/analytics";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function SummaryLayout({ children }: { children: React.ReactNode }) {
  let connected = false;
  if (process.env.DATABASE_URL?.trim()) {
    try { await getAnalyticsMetadata(); connected = true; } catch { connected = false; }
  }
  return (
    <div className="dashboard-shell">
      <DashboardHeader activeTab="metrics" isConnected={connected} />
      <main id="dashboard-content" className="dashboard-workspace">
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
