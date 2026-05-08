import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { collection, addDoc, onSnapshot, getDocs, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function Announcements() {
  const { admin } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "announcements"), (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      arr.sort((a: any, b: any) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return db2.getTime() - da.getTime();
      });
      setAnnouncements(arr);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) { toast.error("Please fill in all fields"); return; }
    setSending(true);
    try {
      // Get all push tokens
      const usersSnap = await getDocs(collection(db, "users"));
      const tokens: string[] = [];
      usersSnap.docs.forEach(d => { const t = d.data().expoPushToken; if (t) tokens.push(t); });

      // Save announcement to Firestore
      await addDoc(collection(db, "announcements"), {
        title: title.trim(), message: message.trim(), createdAt: serverTimestamp(),
        sentBy: admin?.email || "admin", recipientsCount: tokens.length
      });

      // Send push notifications in batches of 100
      if (tokens.length > 0) {
        const batches = [];
        for (let i = 0; i < tokens.length; i += 100) {
          batches.push(tokens.slice(i, i + 100));
        }
        for (const batch of batches) {
          const messages = batch.map(token => ({
            to: token, sound: "default", title: title.trim(), body: message.trim(),
            data: { type: "announcement" }
          }));
          try {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(messages)
            });
          } catch (e) { console.warn("Push batch failed:", e); }
        }
      }

      toast.success(`Announcement sent to ${tokens.length} users!`);
      setTitle(""); setMessage("");
    } catch (e: any) { toast.error(e.message || "Failed to send"); }
    setSending(false);
  };

  const fmtDate = (ts: any) => {
    if (!ts) return ""; try { const d = ts.toDate ? ts.toDate() : new Date(ts); return format(d, "MMM d, yyyy 'at' h:mm a"); } catch { return ""; }
  };

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-white">Announcements</h1><p className="text-secondary text-sm mt-1">Send notifications to all users</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send form */}
        <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">New Announcement</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title..." className="w-full px-4 py-3 bg-background/60 border border-border/50 rounded-xl text-white text-sm placeholder:text-secondary/50 focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message..." rows={5} className="w-full px-4 py-3 bg-background/60 border border-border/50 rounded-xl text-white text-sm placeholder:text-secondary/50 focus:outline-none focus:border-primary/50 resize-none" />
            </div>
            <button onClick={handleSend} disabled={sending} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/25">
              {sending ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span> : "Send Announcement 📢"}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">History</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-16 bg-border/20 rounded-xl animate-pulse" />)}</div>
          ) : announcements.length === 0 ? (
            <p className="text-secondary text-sm py-8 text-center">No announcements yet</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {announcements.map((a: any) => (
                <div key={a.id} className="p-4 rounded-xl bg-background/40 border border-border/30">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">{a.title}</h4>
                    <span className="text-[10px] text-secondary shrink-0">{fmtDate(a.createdAt)}</span>
                  </div>
                  <p className="text-xs text-secondary mt-1 line-clamp-2">{a.message}</p>
                  <p className="text-[10px] text-primary mt-2">Sent to {a.recipientsCount || 0} users</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
