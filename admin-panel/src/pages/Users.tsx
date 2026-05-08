import { useEffect, useState, useMemo } from "react";
import { db } from "../config/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";
import UserTable, { type UserRow } from "../components/UserTable";
import ConfirmDialog from "../components/ConfirmDialog";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all"|"active"|"banned">("all");
  const [sortBy, setSortBy] = useState<"newest"|"oldest"|"listings">("newest");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [confirmAction, setConfirmAction] = useState<{type:string; user?:UserRow}|null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), async (snap) => {
      const arr: UserRow[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        const lSnap = await getDocs(query(collection(db, "listings"), where("userId", "==", d.id)));
        arr.push({ id: d.id, name: data.name||"", email: data.email||"", username: data.username||"", rollNumber: data.rollNumber||"", department: data.department||"", startYear: data.startYear||"", avatar: data.avatar||"", phone: data.phone||"", createdAt: data.createdAt, status: data.status||"active", role: data.role, listingCount: lSnap.size, memberSince: data.memberSince||"", major: data.major||"", bio: data.bio||"", preferences: data.preferences });
      }
      setUsers(arr); setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    let r = [...users];
    if (search) { const s = search.toLowerCase(); r = r.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)); }
    if (statusFilter !== "all") r = r.filter(u => (u.status||"active") === statusFilter);
    r.sort((a,b) => {
      if (sortBy === "listings") return (b.listingCount||0) - (a.listingCount||0);
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt||0);
      const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt||0);
      return sortBy === "newest" ? db2.getTime()-da.getTime() : da.getTime()-db2.getTime();
    });
    return r;
  }, [users, search, statusFilter, sortBy]);

  const handleBan = async (user: UserRow) => {
    setActionLoading(true);
    try { const ns = user.status==="banned"?"active":"banned"; await updateDoc(doc(db,"users",user.id),{status:ns}); toast.success(ns==="banned"?`${user.name} banned`:`${user.name} unbanned`); } catch(e:any){ toast.error(e.message); }
    setActionLoading(false); setConfirmAction(null);
  };
  const handleDelete = async (user: UserRow) => {
    setActionLoading(true);
    try { await deleteDoc(doc(db,"users",user.id)); toast.success(`${user.name} deleted`); } catch(e:any){ toast.error(e.message); }
    setActionLoading(false); setConfirmAction(null);
  };
  const handleBulk = async (type: string) => {
    setActionLoading(true);
    try { for(const id of selectedIds){ if(type==="ban") await updateDoc(doc(db,"users",id),{status:"banned"}); else await deleteDoc(doc(db,"users",id)); } toast.success(`${selectedIds.length} users ${type==="ban"?"banned":"deleted"}`); setSelectedIds([]); } catch(e:any){ toast.error(e.message); }
    setActionLoading(false); setConfirmAction(null);
  };

  const fmtDate = (ts:any) => { if(!ts) return "N/A"; try { const d = ts.toDate?ts.toDate():new Date(ts); return d.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}); } catch { return "N/A"; }};

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-white">User Management</h1><p className="text-secondary text-sm mt-1">{users.length} total users</p></div>

      <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 pr-4 py-2.5 bg-background/60 border border-border/50 rounded-xl text-white text-sm placeholder:text-secondary/50 focus:outline-none focus:border-primary/50" />
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)} className="px-3 py-2.5 bg-background/60 border border-border/50 rounded-xl text-white text-sm focus:outline-none">
            <option value="all">All Status</option><option value="active">Active</option><option value="banned">Banned</option>
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="px-3 py-2.5 bg-background/60 border border-border/50 rounded-xl text-white text-sm focus:outline-none">
            <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="listings">Most Listings</option>
          </select>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30">
            <span className="text-sm text-secondary">{selectedIds.length} selected</span>
            <button onClick={()=>setConfirmAction({type:"bulkBan"})} className="px-3 py-1.5 rounded-lg bg-warning/15 text-warning text-xs font-medium">Ban Selected</button>
            <button onClick={()=>setConfirmAction({type:"bulkDelete"})} className="px-3 py-1.5 rounded-lg bg-danger/15 text-danger text-xs font-medium">Delete Selected</button>
            <button onClick={()=>setSelectedIds([])} className="text-xs text-secondary hover:text-white">Clear</button>
          </div>
        )}
      </div>

      <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl overflow-hidden">
        <UserTable users={filtered} loading={loading} selectedIds={selectedIds}
          onSelectAll={c => setSelectedIds(c ? filtered.map(u=>u.id) : [])}
          onSelectOne={(id,c) => setSelectedIds(c ? [...selectedIds,id] : selectedIds.filter(s=>s!==id))}
          onView={setViewUser}
          onBan={u => setConfirmAction({type: u.status==="banned"?"unban":"ban", user:u})}
          onDelete={u => setConfirmAction({type:"delete", user:u})} />
      </div>

      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setViewUser(null)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={()=>setViewUser(null)} className="absolute top-4 right-4 p-1 text-secondary hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
            <div className="flex items-center gap-4 mb-6">
              <img src={viewUser.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(viewUser.name)}&background=4F46E5&color=fff`} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30" />
              <div><h3 className="text-lg font-bold text-white">{viewUser.name}</h3><p className="text-sm text-secondary">@{viewUser.username}</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${viewUser.status==="banned"?"bg-danger/15 text-danger":"bg-success/15 text-success"}`}>{viewUser.status==="banned"?"Banned":"Active"}</span>
              </div>
            </div>
            <div className="space-y-3">
              {[{l:"Email",v:viewUser.email},{l:"Phone",v:viewUser.phone||"N/A"},{l:"Roll Number",v:viewUser.rollNumber||"N/A"},{l:"Department",v:viewUser.department||"N/A"},{l:"Major",v:viewUser.major||"N/A"},{l:"Start Year",v:viewUser.startYear||"N/A"},{l:"Joined",v:fmtDate(viewUser.createdAt)},{l:"Total Listings",v:String(viewUser.listingCount??0)}].map(i=>(
                <div key={i.l} className="flex justify-between py-2 border-b border-border/30"><span className="text-sm text-secondary">{i.l}</span><span className="text-sm text-white">{i.v}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!confirmAction}
        title={confirmAction?.type?.includes("delete")?"Delete User(s)":confirmAction?.type==="unban"?"Unban User":"Ban User(s)"}
        message={confirmAction?.type==="bulkBan"?`Ban ${selectedIds.length} users?`:confirmAction?.type==="bulkDelete"?`Delete ${selectedIds.length} users?`:confirmAction?.type==="delete"?`Delete ${confirmAction?.user?.name}?`:confirmAction?.type==="unban"?`Unban ${confirmAction?.user?.name}?`:`Ban ${confirmAction?.user?.name}?`}
        confirmLabel={confirmAction?.type?.includes("delete")?"Delete":confirmAction?.type==="unban"?"Unban":"Ban"}
        confirmVariant={confirmAction?.type?.includes("delete")?"danger":confirmAction?.type==="unban"?"primary":"warning"}
        loading={actionLoading} onCancel={()=>setConfirmAction(null)}
        onConfirm={()=>{ if(confirmAction?.type==="bulkBan") handleBulk("ban"); else if(confirmAction?.type==="bulkDelete") handleBulk("delete"); else if((confirmAction?.type==="ban"||confirmAction?.type==="unban")&&confirmAction.user) handleBan(confirmAction.user); else if(confirmAction?.type==="delete"&&confirmAction.user) handleDelete(confirmAction.user); }} />
    </div>
  );
}
