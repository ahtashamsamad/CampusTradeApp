import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import {
  UsersIcon,
  ShoppingBagIcon,
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  FlagIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import StatsCard from "../components/StatsCard";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    activeListings: 0,
    totalMessages: 0,
    pendingReports: 0,
    newUsersToday: 0,
  });
  const [userChartData, setUserChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Users count + new users today + chart data
    const usersUnsub = onSnapshot(collection(db, "users"), (snap) => {
      const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const today = startOfDay(new Date());
      const newToday = users.filter((u: any) => {
        if (!u.createdAt) return false;
        const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        return d >= today;
      });

      // Build 30-day chart
      const chartData = [];
      for (let i = 29; i >= 0; i--) {
        const day = startOfDay(subDays(new Date(), i));
        const nextDay = startOfDay(subDays(new Date(), i - 1));
        const count = users.filter((u: any) => {
          if (!u.createdAt) return false;
          const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
          return d >= day && d < nextDay;
        }).length;
        chartData.push({ date: format(day, "MMM d"), users: count });
      }
      setUserChartData(chartData);

      // Recent user registrations
      const recentUsers = users
        .filter((u: any) => u.createdAt)
        .sort((a: any, b: any) => {
          const da = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const db2 = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return db2.getTime() - da.getTime();
        })
        .slice(0, 5)
        .map((u: any) => ({
          type: "user",
          text: `${u.name || "Unknown"} joined CampusTrade`,
          time: u.createdAt,
        }));

      setStats((p) => ({
        ...p,
        totalUsers: users.length,
        newUsersToday: newToday.length,
      }));

      setRecentActivity((prev) => {
        const nonUser = prev.filter((a) => a.type !== "user");
        return [...recentUsers, ...nonUser]
          .sort((a, b) => {
            const ta = a.time?.toDate ? a.time.toDate() : new Date(a.time);
            const tb = b.time?.toDate ? b.time.toDate() : new Date(b.time);
            return tb.getTime() - ta.getTime();
          })
          .slice(0, 10);
      });

      setLoading(false);
    });
    unsubs.push(usersUnsub);

    // Listings count + category data
    const listingsUnsub = onSnapshot(collection(db, "listings"), (snap) => {
      const listings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const active = listings.filter((l: any) => l.status === "active" || !l.status);

      // Category distribution
      const catMap: Record<string, number> = {};
      listings.forEach((l: any) => {
        const cat = l.category || "Other";
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      const catData = Object.entries(catMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      setCategoryData(catData);

      // Recent listings
      const recentListings = listings
        .filter((l: any) => l.createdAt)
        .sort((a: any, b: any) => {
          const da = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const db2 = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return db2.getTime() - da.getTime();
        })
        .slice(0, 5)
        .map((l: any) => ({
          type: "listing",
          text: `New listing: "${l.title}"`,
          time: l.createdAt,
        }));

      setStats((p) => ({
        ...p,
        totalListings: listings.length,
        activeListings: active.length,
      }));

      setRecentActivity((prev) => {
        const nonListing = prev.filter((a) => a.type !== "listing");
        return [...nonListing, ...recentListings]
          .sort((a, b) => {
            const ta = a.time?.toDate ? a.time.toDate() : new Date(a.time);
            const tb = b.time?.toDate ? b.time.toDate() : new Date(b.time);
            return tb.getTime() - ta.getTime();
          })
          .slice(0, 10);
      });
    });
    unsubs.push(listingsUnsub);

    // Messages count (from chats subcollections - just count chats)
    const chatsUnsub = onSnapshot(collection(db, "chats"), (snap) => {
      setStats((p) => ({ ...p, totalMessages: snap.size }));
    });
    unsubs.push(chatsUnsub);

    // Reports pending
    const reportsUnsub = onSnapshot(
      query(collection(db, "reports"), where("status", "==", "pending")),
      (snap) => {
        setStats((p) => ({ ...p, pendingReports: snap.size }));

        const recentReports = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => {
            const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return db2.getTime() - da.getTime();
          })
          .slice(0, 3)
          .map((r: any) => ({
            type: "report",
            text: `New report: ${r.reason || "No reason"}`,
            time: r.createdAt,
          }));

        setRecentActivity((prev) => {
          const nonReport = prev.filter((a) => a.type !== "report");
          return [...nonReport, ...recentReports]
            .sort((a, b) => {
              const ta = a.time?.toDate ? a.time.toDate() : new Date(a.time);
              const tb = b.time?.toDate ? b.time.toDate() : new Date(b.time);
              return tb.getTime() - ta.getTime();
            })
            .slice(0, 10);
        });
      },
      () => {
        // Reports collection may not exist yet
      }
    );
    unsubs.push(reportsUnsub);

    return () => unsubs.forEach((u) => u());
  }, []);

  const formatTime = (ts: any) => {
    if (!ts) return "";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, "MMM d, h:mm a");
    } catch {
      return "";
    }
  };

  const activityIcons: Record<string, string> = {
    user: "👤",
    listing: "📦",
    report: "🚩",
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-secondary">{label}</p>
        <p className="text-sm font-semibold text-white">{payload[0].value}</p>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-secondary text-sm mt-1">Overview of your CampusTrade platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<UsersIcon className="w-5 h-5" />}
          loading={loading}
        />
        <StatsCard
          title="Total Listings"
          value={stats.totalListings}
          icon={<ShoppingBagIcon className="w-5 h-5" />}
          loading={loading}
        />
        <StatsCard
          title="Active Listings"
          value={stats.activeListings}
          icon={<CheckBadgeIcon className="w-5 h-5" />}
          loading={loading}
        />
        <StatsCard
          title="Total Chats"
          value={stats.totalMessages}
          icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
          loading={loading}
        />
        <StatsCard
          title="Reports Pending"
          value={stats.pendingReports}
          icon={<FlagIcon className="w-5 h-5" />}
          loading={loading}
        />
        <StatsCard
          title="New Users Today"
          value={stats.newUsersToday}
          icon={<UserPlusIcon className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Registration Chart */}
        <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">New Users (Last 30 Days)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis stroke="#888" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#4F46E5" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Chart */}
        <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Listings by Category</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-secondary text-sm py-8 text-center">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-lg">{activityIcons[activity.type] || "📌"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{activity.text}</p>
                </div>
                <span className="text-xs text-secondary shrink-0">
                  {formatTime(activity.time)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
