import { getAuditLogs } from "./actions";
import LogsClient from "./LogsClient";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const initialLogs = await getAuditLogs();
  
  return <LogsClient initialLogs={initialLogs} />;
}
