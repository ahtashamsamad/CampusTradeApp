import { format } from "date-fns";
import {
  EyeIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export interface ReportRow {
  id: string;
  reportedBy: string;
  reporterName?: string;
  reportedItem: string;
  reportedItemTitle?: string;
  reportedUserName?: string;
  type: "listing" | "user";
  reason: string;
  description: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: any;
}

interface ReportTableProps {
  reports: ReportRow[];
  loading: boolean;
  onView: (report: ReportRow) => void;
  onResolve: (report: ReportRow) => void;
  onBanUser: (report: ReportRow) => void;
  onDeleteListing: (report: ReportRow) => void;
  onDismiss: (report: ReportRow) => void;
}

export default function ReportTable({
  reports,
  loading,
  onView,
  onResolve,
  onBanUser,
  onDeleteListing,
  onDismiss,
}: ReportTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-border/20 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary text-lg">No reports found</p>
        <p className="text-secondary/60 text-sm mt-1">All clear! 🎉</p>
      </div>
    );
  }

  const formatDate = (ts: any) => {
    if (!ts) return "N/A";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, "MMM d, yyyy");
    } catch {
      return "N/A";
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    resolved: "bg-success/15 text-success",
    dismissed: "bg-secondary/15 text-secondary",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              Reporter
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              Type
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">
              Reported Item/User
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">
              Reason
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">
              Date
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              Status
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr
              key={report.id}
              className="border-b border-border/30 hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3 px-4">
                <span className="text-sm text-white">{report.reporterName || report.reportedBy}</span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    report.type === "listing" ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning"
                  }`}
                >
                  {report.type === "listing" ? "Listing" : "User"}
                </span>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <span className="text-sm text-secondary truncate max-w-[200px] block">
                  {report.type === "listing"
                    ? report.reportedItemTitle || report.reportedItem
                    : report.reportedUserName || report.reportedItem}
                </span>
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <span className="text-sm text-secondary">{report.reason}</span>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <span className="text-sm text-secondary">{formatDate(report.createdAt)}</span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[report.status]
                  }`}
                >
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(report)}
                    className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                    title="View"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  {report.status === "pending" && (
                    <>
                      <button
                        onClick={() => onResolve(report)}
                        className="p-1.5 rounded-lg text-secondary hover:text-success hover:bg-success/10 transition-colors"
                        title="Resolve"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                      {report.type === "user" && (
                        <button
                          onClick={() => onBanUser(report)}
                          className="p-1.5 rounded-lg text-secondary hover:text-warning hover:bg-warning/10 transition-colors"
                          title="Ban User"
                        >
                          <NoSymbolIcon className="w-4 h-4" />
                        </button>
                      )}
                      {report.type === "listing" && (
                        <button
                          onClick={() => onDeleteListing(report)}
                          className="p-1.5 rounded-lg text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Delete Listing"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDismiss(report)}
                        className="p-1.5 rounded-lg text-secondary hover:text-secondary/70 hover:bg-secondary/10 transition-colors"
                        title="Dismiss"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
