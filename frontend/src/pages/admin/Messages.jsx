// src/pages/admin/Messages.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function Messages() {
  const { tr } = useTheme();
  const [messages,  setMessages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [reply,     setReply]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [filter,    setFilter]    = useState("All");

  const fetchMessages = () => {
    setLoading(true);
    API.get("/messages").then(({ data }) => data)
      .then((data) => setMessages(data))
      .catch(() => toast.error(tr("Failed to load messages")))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleOpen = async (msg) => {
    setSelected(msg);
    setReply(msg.reply || "");
    if (!msg.read) {
      try {
        await API.put(`/messages/${msg._id}`, { reply: msg.reply || "" });
        setMessages((m) => m.map((x) => x._id === msg._id ? { ...x, read: true } : x));
      } catch { /* silent */ }
    }
  };

  const handleReply = async () => {
    if (!reply.trim()) { toast.error(tr("Please type a reply")); return; }
    setSending(true);
    try {
      const { data } = await API.put(`/messages/${selected._id}`, { reply });
      setMessages((m) => m.map((x) => x._id === selected._id ? data : x));
      setSelected(data);
      toast.success(`${tr("Reply saved for")} ${selected.name}`);
    } catch { toast.error(tr("Failed to send reply")); }
    finally { setSending(false); }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/messages/${id}`);
      setMessages((m) => m.filter((x) => x._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success(tr("Message deleted"));
    } catch { toast.error(tr("Failed to delete")); }
  };

  const filtered = messages.filter((m) => {
    if (filter === "Unread") return !m.read;
    if (filter === "Read")   return m.read;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>{tr("Messages")}</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>
            {tr("Customer enquiries and contact requests")}
            {unreadCount > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-500 text-xs font-bold">{unreadCount} unread</span>}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {["All", "Unread", "Read"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${filter === f ? "bg-violet-500/15 text-violet-500 border-violet-500/30" : "hover:bg-white/5"}`}
            style={filter !== f ? { borderColor: "var(--border)", color: "var(--text2)" } : {}}
          >
            {tr(f)}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* List */}
        <div className="lg:col-span-2 glass overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium" style={{ color: "var(--text3)" }}>{tr("Loading customer messages…")}</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filtered.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => handleOpen(msg)}
                  className={`p-4 cursor-pointer transition ${selected?._id === msg._id ? "bg-violet-500/10" : "hover:bg-white/5"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {!msg.read && <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />}
                      <p className={`text-sm truncate ${!msg.read ? "font-bold" : "font-medium"}`} style={{ color: "var(--text)" }}>{msg.name}</p>
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text3)" }}>
                      {new Date(msg.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <p className="text-xs font-medium truncate mb-0.5" style={{ color: "var(--text2)" }}>{msg.subject}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text3)" }}>{msg.message}</p>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-sm" style={{ color: "var(--text3)" }}>{tr("No messages")}</div>
              )}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="glass p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>{selected.subject}</h3>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text3)" }}>
                    From: <span className="font-medium" style={{ color: "var(--text2)" }}>{selected.name}</span>
                    {" · "}{selected.email}
                    {" · "}{new Date(selected.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <button onClick={() => handleDelete(selected._id)} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex-shrink-0">
                  {tr("Delete")}
                </button>
              </div>

              <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text2)" }}>
                {selected.message}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                  {selected.reply ? tr("Edit Reply") : tr("Reply")}
                </label>
                <textarea
                  className="textarea-field"
                  rows={4}
                  placeholder={`Reply to ${selected.name}…`}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <button onClick={handleReply} disabled={sending} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
                  {sending ? tr("Saving…") : tr("Save Reply")}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass p-12 flex flex-col items-center justify-center text-center h-full min-h-64">
              <span className="text-5xl mb-4">💬</span>
              <p className="font-semibold" style={{ color: "var(--text2)" }}>{tr("Select a message to read")}</p>
              <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>{tr("Click any message on the left")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
