import { useEffect, useState, useMemo } from "react";
import { db } from "../config/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import ReportTable, { type ReportRow } from "../components/ReportTable";
import ConfirmDialog from "../components/ConfirmDialog";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function Reports() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewReport, setViewReport] = useState<ReportRow|null>(null);
  const [confirmAction, setConfirmAction] = useState<{type:string;report?:ReportRow}|null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reports"), async (snap) => {
      const arr: ReportRow[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        let reporterName = data.reportedBy;
        let reportedItemTitle = data.reportedItem;
        let reportedUserName = data.reportedItem;
        try {
          if (data.reportedBy) { const uDoc = await getDoc(doc(db,"users",data.reportedBy)); if(uDoc.exists()) reporterName = uDoc.data().name; }
          if (data.type === "listing" && data.reportedItem) { const lDoc = await getDoc(doc(db,"listings",data.reportedItem)); if(lDoc.exists()) reportedItemTitle = lDoc.data().title; }
          if (data.type === "user" && data.reportedItem) { const uDoc = await getDoc(doc(db,"users",data.reportedItem)); if(uDoc.exists()) reportedUserName = uDoc.data().name; }
        } catch {}
        arr.push({ id:d.id, reportedBy:data.reportedBy||"", reporterName, reportedItem:data.reportedItem||"", reportedItemTitle, reportedUserName, type:data.type||"listing", reason:data.reason||"", description:data.description||"", status:data.status||"pending", createdAt:data.createdAt });
      }
      setReports(arr); setLoading(false);
    }, () => { setLoading(false); });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    let r = [...reports];
    if (statusFilter !== "all") r = r.filter(rp => rp.status === statusFilter);
    if (typeFilter !== "all") r = r.filter(rp => rp.type === typeFilter);
    r.sort((a,b) => { const da=a.createdAt?.toDate?a.createdAt.toDate():new Date(a.createdAt||0); const db2=b.createdAt?.toDate?b.createdAt.toDate():new Date(b.createdAt||0); return db2.getTime()-da.getTime(); });
    return r;
  }, [reports, statusFilter, typeFilter]);

  const handleResolve = async (report: ReportRow) => {
    setActionLoading(true);
    try { await updateDoc(doc(db,"reports",report.id),{status:"resolved"}); toast.success("Report resolved"); } catch(e:any){ toast.error(e.message); }
    setActionLoading(false); setConfirmAction(null);
  };
  const handleDismiss = async (report: ReportRow) => {
    setActionLoading(true);
    try { await updateDoc(doc(db,"reports",report.id),{status:"dismissed"}); toast.success("Report dismissed"); } catch(e:any){ toast.error(e.message); }
    setActionLoading(false); setConfirmAction(null);
  };
  const handleBanUser = async (report: ReportRow) => {
    setActionLoading(true);
    try { await updateDoc(doc(db,"users",report.reportedItem),{status:"banned"}); await updateDoc(doc(db,"reports",report.id),{status:"resolved"}); toast.success("User banned & report resolved"); } catch(e:any){ toast.error(e.message); }
    setActionLoading(false); setConfirmAction(null);
  };
  const handleDeleteListing = async (report: ReportRow) => {
    setActionLoading(true);
    try { await deleteDoc(doc(db,"listings",report.reportedItem)); await updateDoc(doc(db,"reports",report.id),{status:"resolved"}); toast.success("Listing deleted & report resolved"); } catch(e:any){ toast.error(e.message); }
    setActionLoading(false); setConfirmAction(null);
  };

  const fmtDate = (ts:any) => { if(!ts) return "N/A"; try { const d=ts.toDate?ts.toDate():new Date(ts); return d.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); } catch { return "N/A"; }};

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-white">Reports & Complaints</h1><p className="text-secondary text-sm mt-1">{reports.filter(r=>r.status==="pending").length} pending reports</p></div>

      <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-background/60 border border-border/50 rounded-xl text-white text-sm focus:outline-none">
            <option value="all">All Status</option><option value="pending">Pending</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option>
          </select>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="px-3 py-2.5 bg-background/60 border border-border/50 rounded-xl text-white text-sm focus:outline-none">
            <option value="all">All Types</option><option value="listing">Listing Reports</option><option value="user">User Reports</option>
          </select>
        </div>
      </div>

      <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl overflow-hidden">
        <ReportTable reports={filtered} loading={loading} onView={setViewReport}
          onResolve={r=>setConfirmAction({type:"resolve",report:r})}
          onBanUser={r=>setConfirmAction({type:"banUser",report:r})}
          onDeleteListing={r=>setConfirmAction({type:"deleteListing",report:r})}
          onDismiss={r=>setConfirmAction({type:"dismiss",report:r})} />
      </div>

      {viewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setViewReport(null)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <button onClick={()=>setViewReport(null)} className="absolute top-4 right-4 p-1 text-secondary hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-white mb-4">Report Details</h3>
            <div className="space-y-3">
              {[{l:"Reporter",v:viewReport.reporterName||viewReport.reportedBy},{l:"Type",v:viewReport.type},{l:"Reported",v:viewReport.type==="listing"?viewReport.reportedItemTitle:viewReport.reportedUserName},{l:"Reason",v:viewReport.reason},{l:"Status",v:viewReport.status},{l:"Date",v:fmtDate(viewReport.createdAt)}].map(i=>(
                <div key={i.l} className="flex justify-between py-2 border-b border-border/30"><span className="text-sm text-secondary">{i.l}</span><span className="text-sm text-white">{i.v}</span></div>
              ))}
              {viewReport.description && <div className="pt-2"><p className="text-xs text-secondary mb-1">Description</p><p className="text-sm text-white/80">{viewReport.description}</p></div>}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!confirmAction}
        title={confirmAction?.type==="resolve"?"Resolve Report":confirmAction?.type==="banUser"?"Ban Reported User":confirmAction?.type==="deleteListing"?"Delete Reported Listing":"Dismiss Report"}
        message={confirmAction?.type==="resolve"?"Mark this report as resolved?":confirmAction?.type==="banUser"?"Ban the reported user and resolve this report?":confirmAction?.type==="deleteListing"?"Delete the reported listing and resolve this report?":"Dismiss this report as invalid?"}
        confirmLabel={confirmAction?.type==="resolve"?"Resolve":confirmAction?.type==="banUser"?"Ban User":confirmAction?.type==="deleteListing"?"Delete Listing":"Dismiss"}
        confirmVariant={confirmAction?.type==="banUser"?"warning":confirmAction?.type==="deleteListing"?"danger":"primary"}
        loading={actionLoading} onCancel={()=>setConfirmAction(null)}
        onConfirm={()=>{ const r=confirmAction?.report; if(!r) return; if(confirmAction?.type==="resolve") handleResolve(r); else if(confirmAction?.type==="banUser") handleBanUser(r); else if(confirmAction?.type==="deleteListing") handleDeleteListing(r); else if(confirmAction?.type==="dismiss") handleDismiss(r); }} />
    </div>
  );
}
