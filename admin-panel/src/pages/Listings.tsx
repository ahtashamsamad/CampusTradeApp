import { useEffect, useState, useMemo } from "react";
import { db } from "../config/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import ListingTable, { type ListingRow } from "../components/ListingTable";
import ConfirmDialog from "../components/ConfirmDialog";
import StatsCard from "../components/StatsCard";
import { MagnifyingGlassIcon, XMarkIcon, ShoppingBagIcon, CheckBadgeIcon, TagIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { startOfDay } from "date-fns";

const CATEGORIES = ["All","Books","Tech","Lab Gear","Furniture","Clothing","Sports","Notes","Transport","Services","Other"];

export default function Listings() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewListing, setViewListing] = useState<ListingRow|null>(null);
  const [confirmAction, setConfirmAction] = useState<{type:string;listing?:ListingRow}|null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "listings"), async (snap) => {
      const arr: ListingRow[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        let sellerName = "Unknown";
        if (data.userId) { try { const uDoc = await getDoc(doc(db,"users",data.userId)); if(uDoc.exists()) sellerName = uDoc.data().name||"Unknown"; } catch {} }
        arr.push({ id:d.id, title:data.title||"", price:data.price||0, category:data.category||"Other", condition:data.condition||"Good", status:data.status||"active", imageUrl:data.imageUrl||null, images:data.images||[], description:data.description||"", userId:data.userId||"", sellerName, isNegotiable:data.isNegotiable, meetupLocation:data.meetupLocation||"", createdAt:data.createdAt });
      }
      setListings(arr); setLoading(false);
    });
    return unsub;
  }, []);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const active = listings.filter(l=>l.status==="active").length;
    const sold = listings.filter(l=>l.status==="sold").length;
    const todayCount = listings.filter(l=>{ if(!l.createdAt) return false; const d=l.createdAt.toDate?l.createdAt.toDate():new Date(l.createdAt); return d>=today; }).length;
    return { total:listings.length, active, sold, today:todayCount };
  }, [listings]);

  const filtered = useMemo(() => {
    let r = [...listings];
    if (search) { const s = search.toLowerCase(); r = r.filter(l => l.title.toLowerCase().includes(s) || l.sellerName?.toLowerCase().includes(s)); }
    if (catFilter !== "All") r = r.filter(l => l.category === catFilter);
    if (statusFilter !== "all") r = r.filter(l => l.status === statusFilter);
    r.sort((a,b) => {
      if (sortBy === "priceHigh") return b.price - a.price;
      if (sortBy === "priceLow") return a.price - b.price;
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt||0);
      const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt||0);
      return sortBy === "newest" ? db2.getTime()-da.getTime() : da.getTime()-db2.getTime();
    });
    return r;
  }, [listings, search, catFilter, statusFilter, sortBy]);

  const handleDelete = async (listing: ListingRow) => {
    setActionLoading(true);
    try { await deleteDoc(doc(db,"listings",listing.id)); toast.success("Listing deleted"); } catch(e:any){ toast.error(e.message); }
    setActionLoading(false); setConfirmAction(null);
  };
  const handleMarkSold = async (listing: ListingRow) => {
    setActionLoading(true);
    try { await updateDoc(doc(db,"listings",listing.id),{status:"sold"}); toast.success("Marked as sold"); } catch(e:any){ toast.error(e.message); }
    setActionLoading(false); setConfirmAction(null);
  };

  const fmtDate = (ts:any) => { if(!ts) return "N/A"; try { const d=ts.toDate?ts.toDate():new Date(ts); return d.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}); } catch { return "N/A"; }};

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-white">Listings Management</h1><p className="text-secondary text-sm mt-1">Manage all marketplace listings</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total" value={stats.total} icon={<ShoppingBagIcon className="w-5 h-5"/>} loading={loading} />
        <StatsCard title="Active" value={stats.active} icon={<CheckBadgeIcon className="w-5 h-5"/>} loading={loading} />
        <StatsCard title="Sold" value={stats.sold} icon={<TagIcon className="w-5 h-5"/>} loading={loading} />
        <StatsCard title="Today" value={stats.today} icon={<CalendarIcon className="w-5 h-5"/>} loading={loading} />
      </div>

      <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search listings or seller..." className="w-full pl-9 pr-4 py-2.5 bg-background/60 border border-border/50 rounded-xl text-white text-sm placeholder:text-secondary/50 focus:outline-none focus:border-primary/50" />
          </div>
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="px-3 py-2.5 bg-background/60 border border-border/50 rounded-xl text-white text-sm focus:outline-none">
            {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-background/60 border border-border/50 rounded-xl text-white text-sm focus:outline-none">
            <option value="all">All Status</option><option value="active">Active</option><option value="sold">Sold</option>
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-3 py-2.5 bg-background/60 border border-border/50 rounded-xl text-white text-sm focus:outline-none">
            <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="priceHigh">Price ↑</option><option value="priceLow">Price ↓</option>
          </select>
        </div>
      </div>

      <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl overflow-hidden">
        <ListingTable listings={filtered} loading={loading} onView={setViewListing}
          onDelete={l=>setConfirmAction({type:"delete",listing:l})}
          onMarkSold={l=>setConfirmAction({type:"sold",listing:l})} />
      </div>

      {viewListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setViewListing(null)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={()=>setViewListing(null)} className="absolute top-4 right-4 p-1 text-secondary hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
            {viewListing.images?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
                {viewListing.images.map((img,i)=> <img key={i} src={img} alt="" className="w-32 h-24 rounded-xl object-cover ring-1 ring-border shrink-0" />)}
              </div>
            )}
            <h3 className="text-lg font-bold text-white mb-2">{viewListing.title}</h3>
            <div className="space-y-3">
              {[{l:"Price",v:`Rs ${viewListing.price?.toLocaleString()}`},{l:"Category",v:viewListing.category},{l:"Condition",v:viewListing.condition},{l:"Status",v:viewListing.status},{l:"Seller",v:viewListing.sellerName||"Unknown"},{l:"Negotiable",v:viewListing.isNegotiable?"Yes":"No"},{l:"Meetup",v:viewListing.meetupLocation||"N/A"},{l:"Posted",v:fmtDate(viewListing.createdAt)}].map(i=>(
                <div key={i.l} className="flex justify-between py-2 border-b border-border/30"><span className="text-sm text-secondary">{i.l}</span><span className="text-sm text-white">{i.v}</span></div>
              ))}
              <div className="pt-2"><p className="text-xs text-secondary mb-1">Description</p><p className="text-sm text-white/80 leading-relaxed">{viewListing.description||"No description"}</p></div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!confirmAction}
        title={confirmAction?.type==="delete"?"Delete Listing":"Mark as Sold"}
        message={confirmAction?.type==="delete"?`Delete "${confirmAction?.listing?.title}"?`:`Mark "${confirmAction?.listing?.title}" as sold?`}
        confirmLabel={confirmAction?.type==="delete"?"Delete":"Mark Sold"}
        confirmVariant={confirmAction?.type==="delete"?"danger":"primary"}
        loading={actionLoading} onCancel={()=>setConfirmAction(null)}
        onConfirm={()=>{ if(confirmAction?.type==="delete"&&confirmAction.listing) handleDelete(confirmAction.listing); else if(confirmAction?.type==="sold"&&confirmAction.listing) handleMarkSold(confirmAction.listing); }} />
    </div>
  );
}
