import { format } from "date-fns";
import {
  EyeIcon,
  NoSymbolIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  username: string;
  rollNumber: string;
  department: string;
  startYear: string;
  avatar: string;
  phone: string;
  createdAt: any;
  status?: string;
  role?: string;
  listingCount?: number;
  memberSince?: string;
  major?: string;
  bio?: string;
  preferences?: any;
}

interface UserTableProps {
  users: UserRow[];
  loading: boolean;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onView: (user: UserRow) => void;
  onBan: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}

export default function UserTable({
  users,
  loading,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onView,
  onBan,
  onDelete,
}: UserTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-border/20 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary text-lg">No users found</p>
        <p className="text-secondary/60 text-sm mt-1">Try adjusting your search or filters</p>
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              <input
                type="checkbox"
                checked={selectedIds.length === users.length && users.length > 0}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-border bg-transparent accent-primary"
              />
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              User
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">
              Roll Number
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">
              Department
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">
              Joined
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              Status
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">
              Listings
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-border/30 hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(user.id)}
                  onChange={(e) => onSelectOne(user.id, e.target.checked)}
                  className="rounded border-border bg-transparent accent-primary"
                />
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-border"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-secondary truncate">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <span className="text-sm text-secondary">{user.rollNumber || "—"}</span>
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <span className="text-sm text-secondary">{user.department || "—"}</span>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <span className="text-sm text-secondary">{formatDate(user.createdAt)}</span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.status === "banned"
                      ? "bg-danger/15 text-danger"
                      : "bg-success/15 text-success"
                  }`}
                >
                  {user.status === "banned" ? "Banned" : "Active"}
                </span>
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <span className="text-sm text-secondary">{user.listingCount ?? 0}</span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(user)}
                    className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                    title="View"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onBan(user)}
                    className="p-1.5 rounded-lg text-secondary hover:text-warning hover:bg-warning/10 transition-colors"
                    title={user.status === "banned" ? "Unban" : "Ban"}
                  >
                    <NoSymbolIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="p-1.5 rounded-lg text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
