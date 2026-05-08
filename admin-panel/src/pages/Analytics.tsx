import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { PageLoader } from "../components/LoadingSpinner";

const COLORS = ["#4F46E5","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"];

export default function Analytics() {
  const [userChartData, setUserChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [conditionData, setConditionData] = useState<any[]>([]);
  const [msgChartData, setMsgChartData] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Users
    unsubs.push(onSnapshot(collection(db, "users"), (snap) => {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const chart = [];
      for (let i = 29; i >= 0; i--) {
        const day = startOfDay(subDays(new Date(), i));
        const next = startOfDay(subDays(new Date(), i - 1));
        const count = users.filter((u: any) => { if(!u.createdAt) return false; const d=u.createdAt.toDate?u.createdAt.toDate():new Date(u.createdAt); return d>=day && d<next; }).length;
        chart.push({ date: format(day, "MMM d"), users: count });
      }
      setUserChartData(chart);
      setLoading(false);
    }));

    // Listings
    unsubs.push(onSnapshot(collection(db, "listings"), async (snap) => {
      const listings = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Category
      const catMap: Record<string,number> = {};
      listings.forEach((l:any) => { catMap[l.category||"Other"] = (catMap[l.category||"Other"]||0)+1; });
      setCategoryData(Object.entries(catMap).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value));

      // Condition
      const condMap: Record<string,number> = {};
      listings.forEach((l:any) => { condMap[l.condition||"Good"] = (condMap[l.condition||"Good"]||0)+1; });
      setConditionData(Object.entries(condMap).map(([name,value])=>({name,value})));

      // Top users by listing count
      const userMap: Record<string,number> = {};
      listings.forEach((l:any) => { if(l.userId) userMap[l.userId] = (userMap[l.userId]||0)+1; });
      const topUserIds = Object.entries(userMap).sort((a,b)=>b[1]-a[1]).slice(0,10);

      // Resolve names
      const usersSnap = await import("firebase/firestore").then(m => m.getDocs(collection(db, "users")));
      const nameMap: Record<string,string> = {};
      usersSnap.docs.forEach(d => { nameMap[d.id] = d.data().name || "Unknown"; });
      setTopUsers(topUserIds.map(([id,count])=>({ name: nameMap[id]||id.slice(0,8), listings: count })));
    }));

    // Chats (as proxy for messages)
    unsubs.push(onSnapshot(collection(db, "chats"), (snap) => {
      const chats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const chart = [];
      for (let i = 29; i >= 0; i--) {
        const day = startOfDay(subDays(new Date(), i));
        const next = startOfDay(subDays(new Date(), i - 1));
        const count = chats.filter((c: any) => { if(!c.lastMessageTime) return false; const d=c.lastMessageTime.toDate?c.lastMessageTime.toDate():new Date(c.lastMessageTime); return d>=day && d<next; }).length;
        chart.push({ date: format(day, "MMM d"), messages: count });
      }
      setMsgChartData(chart);
    }));

    return () => unsubs.forEach(u => u());
  }, []);

  const exportCSV = () => {
    const rows = [["Category","Count"], ...categoryData.map(d=>[d.name,d.value])];
    const csv = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "analytics.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({active,payload,label}:any) => {
    if(!active||!payload?.length) return null;
    return <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl"><p className="text-xs text-secondary">{label}</p><p className="text-sm font-semibold text-white">{payload[0].value}</p></div>;
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Analytics</h1><p className="text-secondary text-sm mt-1">Platform insights and trends</p></div>
        <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25 transition-colors">Export CSV</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registrations */}
        <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">User Registrations (30 Days)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userChartData}><CartesianGrid strokeDasharray="3 3" stroke="#333"/><XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} interval="preserveStartEnd"/><YAxis stroke="#888" fontSize={11} tickLine={false} allowDecimals={false}/><Tooltip content={<CustomTooltip/>}/><Line type="monotone" dataKey="users" stroke="#4F46E5" strokeWidth={2} dot={false}/></LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Listings by Category</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}><CartesianGrid strokeDasharray="3 3" stroke="#333"/><XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false}/><YAxis stroke="#888" fontSize={11} tickLine={false} allowDecimals={false}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="value" fill="#4F46E5" radius={[4,4,0,0]}/></BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Condition Pie Chart */}
        <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Listings by Condition</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={conditionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} fontSize={11}>
                {conditionData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie><Tooltip/></PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Messages Chart */}
        <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Chat Activity (30 Days)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={msgChartData}><CartesianGrid strokeDasharray="3 3" stroke="#333"/><XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} interval="preserveStartEnd"/><YAxis stroke="#888" fontSize={11} tickLine={false} allowDecimals={false}/><Tooltip content={<CustomTooltip/>}/><Line type="monotone" dataKey="messages" stroke="#22c55e" strokeWidth={2} dot={false}/></LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Most Active Users (by Listings)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topUsers} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#333"/><XAxis type="number" stroke="#888" fontSize={11} tickLine={false} allowDecimals={false}/><YAxis type="category" dataKey="name" stroke="#888" fontSize={11} tickLine={false} width={100}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="listings" fill="#8b5cf6" radius={[0,4,4,0]}/></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
