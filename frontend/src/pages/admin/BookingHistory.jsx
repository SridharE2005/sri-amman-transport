import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import {
  FiCopy,
  FiTrash2,
  FiCheck,
  FiX,
  FiCalendar,
  FiPhone,
  FiMail,
  FiUser,
  FiPackage,
  FiTruck,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { HistorySkeleton } from "../../components/AdminSkeletons";

const HISTORY_STATUSES = ["All", "Delivered", "Rejected", "Revoked", "Cancelled"];

const statusConfig = {
  Delivered: {
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
    label: "Delivered",
  },
  Rejected: {
    badge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    dot: "bg-rose-500",
    label: "Rejected",
  },
  Revoked: {
    badge: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    dot: "bg-orange-500",
    label: "Revoked",
  },
  CANCELLED_BY_USER: {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
    label: "Cancelled by User",
  },
  CANCELLED_BY_ADMIN: {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
    label: "Cancelled by Admin",
  },
  "Cancelled by User": {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
    label: "Cancelled by User",
  },
  "Cancelled by Admin": {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
    label: "Cancelled by Admin",
  },
};

const getMaterialIcon = (material) => {
  if (material === "Bricks") return "🧱";
  if (material === "Dry Grass Rolls") return "🌾";
  if (material === "River Sand") return "🏖️";
  if (material === "M-Sand") return "⛏️";
  return "📦";
};

const getQuantityLabel = (record) => {
  const qty = record?.orderQty || 0;
  const mat = record?.material || "";
  if (mat === "Bricks") return `${qty} bricks`;
  if (mat === "Dry Grass Rolls") return `${qty} rolls`;
  return `${qty} units`;
};

export default function BookingHistory() {
  const { tr } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Server-side pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    All: 0,
    Delivered: 0,
    Rejected: 0,
    Revoked: 0,
    Cancelled: 0,
  });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchHistory = () => {
    setLoading(true);
    API.get("/admin-history", {
      params: {
        page,
        limit,
        status: filter,
        search: debouncedSearch.trim() || undefined,
      },
    })
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setHistory(data);
          setTotalCount(data.length);
          setTotalPages(1);
        } else {
          setHistory(data.data || []);
          setTotalCount(data.total || 0);
          setTotalPages(data.totalPages || 1);
          if (data.counts) {
            setStatusCounts(data.counts);
          }
        }
      })
      .catch(() => toast.error(tr("Failed to load booking history")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [page, filter, debouncedSearch]);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedRecord(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCopy = (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(tr("Booking ID copied!"));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFilterChange = (status) => {
    setFilter(status);
    setPage(1);
  };

  const deleteBookings = async (ids, e) => {
    if (e) e.stopPropagation();
    if (
      !ids.length ||
      !window.confirm(
        `Delete ${ids.length} history record${
          ids.length > 1 ? "s" : ""
        }? This cannot be undone.`
      )
    )
      return;
    setDeleting(true);
    try {
      await Promise.all(ids.map((id) => API.delete(`/admin-history/${id}`)));
      if (selectedRecord && ids.includes(selectedRecord._id)) {
        setSelectedRecord(null);
      }
      toast.success(tr("History deleted"));
      fetchHistory();
    } catch {
      toast.error(tr("Failed to delete history"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-[1250px] mx-auto space-y-5 px-3 sm:px-6 py-6 pb-16">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            {tr("Booking History")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text3)" }}>
            {tr("Completed and closed bookings")}
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => deleteBookings(history.map((r) => r._id))}
            disabled={deleting}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition-all duration-150 disabled:opacity-40 cursor-pointer"
          >
            <FiTrash2 className="text-xs" />
            {tr("Delete Current Page")}
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {HISTORY_STATUSES.map((status) => {
            const count = statusCounts[status] ?? 0;

            return (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filter === status
                    ? "bg-violet-600 text-white border-violet-600"
                    : "hover:bg-white/5"
                }`}
                style={
                  filter === status
                    ? {}
                    : { borderColor: "var(--border)", color: "var(--text2)" }
                }
              >
                {status}
                <span className="ml-1.5 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={tr("Search history...")}
          className="sm:w-64 px-3.5 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--input-border)",
            color: "var(--input-text)",
          }}
        />
      </div>

      {/* Content: Laptop Table View & Mobile Rectangular Card View */}
      {loading ? (
        <HistorySkeleton />
      ) : history.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--text3)" }}>
            {tr("No history records found.")}
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden shadow-xs"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {/* Laptop View: Table Format */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="border-b text-xs font-bold uppercase tracking-wider"
                  style={{ borderColor: "var(--border)", color: "var(--text3)" }}
                >
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Booking ID</th>
                  <th className="py-4 px-5">Material Title</th>
                  <th className="py-4 px-5">Customer Name</th>
                  <th className="py-4 px-5">Quantity</th>
                  <th className="py-4 px-5">Total Amount</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm" style={{ borderColor: "var(--border)" }}>
                {history.map((record) => {
                  const bId =
                    record.bookingId ||
                    (record.booking && typeof record.booking === "object"
                      ? record.booking.bookingId
                      : record.booking) ||
                    "";
                  const statusMeta =
                    statusConfig[record.status] || {
                      badge: "bg-gray-100 text-gray-700",
                      dot: "bg-gray-400",
                      label: record.status,
                    };

                  return (
                    <tr
                      key={record._id}
                      onClick={() => setSelectedRecord(record)}
                      className="hover:bg-violet-500/[0.04] transition-colors cursor-pointer"
                      title={tr("Click to view full details")}
                    >
                      {/* Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badge}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                          {tr(statusMeta.label || record.status)}
                        </span>
                      </td>

                      {/* Booking ID */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                            {bId || "—"}
                          </span>
                          {bId && (
                            <button
                              onClick={(e) => handleCopy(bId, e)}
                              title={tr("Copy Booking ID")}
                              className="p-1 rounded text-xs text-gray-400 hover:text-violet-500 transition cursor-pointer"
                            >
                              {copiedId === bId ? (
                                <FiCheck className="text-emerald-500 text-xs" />
                              ) : (
                                <FiCopy className="text-xs" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Material Title */}
                      <td className="py-4 px-5">
                        <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
                          {record.title || record.material || "Material booking"}
                        </p>
                        {record.material && record.title && record.title !== record.material && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                            {record.material}
                          </p>
                        )}
                      </td>

                      {/* Customer Name */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                          {record.customerName || "—"}
                        </p>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
                          {getQuantityLabel(record)}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {record.estimatedAmount
                            ? `₹${Number(record.estimatedAmount).toLocaleString("en-IN")}`
                            : "—"}
                        </span>
                      </td>

                      {/* Action: Delete */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => deleteBookings([record._id], e)}
                          disabled={deleting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition-all duration-150 disabled:opacity-40 cursor-pointer"
                        >
                          <FiTrash2 className="text-xs" />
                          {tr("Delete")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Rectangular Card Format */}
          <div className="md:hidden p-3 space-y-3">
            {history.map((record) => {
              const statusMeta =
                statusConfig[record.status] || {
                  badge: "bg-gray-100 text-gray-700",
                  dot: "bg-gray-400",
                  label: record.status,
                };

              const deliveryDate = new Date(
                record.updatedAt || record.createdAt
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <article
                  key={record._id}
                  onClick={() => setSelectedRecord(record)}
                  className="p-3.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-[0.99] flex flex-col justify-between gap-2.5 shadow-xs hover:border-violet-500/50"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  {/* Top: Status Badge + Delivery Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 ${statusMeta.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                      {tr(statusMeta.label || record.status)}
                    </span>

                    <span
                      className="text-xs font-medium whitespace-nowrap"
                      style={{ color: "var(--text3)" }}
                    >
                      {deliveryDate}
                    </span>
                  </div>

                  {/* Middle: Customer Name & Material Title */}
                  <div className="space-y-0.5">
                    <p
                      className="font-extrabold text-base leading-snug truncate"
                      style={{ color: "var(--text)" }}
                    >
                      {record.customerName || tr("Not provided")}
                    </p>
                    <p
                      className="text-xs font-medium line-clamp-1"
                      style={{ color: "var(--text2)" }}
                    >
                      {record.title || record.material || "Material booking"}
                    </p>
                  </div>

                  {/* Bottom: View Details Hint + Delete Button */}
                  <div
                    className="flex items-center justify-between gap-2 pt-2 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span className="text-[11px] font-semibold text-violet-500 hover:underline">
                      {tr("View Details")} →
                    </span>

                    <button
                      onClick={(e) => deleteBookings([record._id], e)}
                      disabled={deleting}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition-all duration-150 disabled:opacity-40 cursor-pointer"
                      title={tr("Delete")}
                    >
                      <FiTrash2 className="text-xs" />
                      {tr("Delete")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination Controls Footer inside table card */}
          {totalPages > 1 && (
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text3)" }}>
                {tr("Showing")}{" "}
                <span className="font-bold" style={{ color: "var(--text)" }}>
                  {Math.min((page - 1) * limit + 1, totalCount)}
                </span>{" "}
                -{" "}
                <span className="font-bold" style={{ color: "var(--text)" }}>
                  {Math.min(page * limit, totalCount)}
                </span>{" "}
                {tr("of")}{" "}
                <span className="font-bold" style={{ color: "var(--text)" }}>
                  {totalCount}
                </span>{" "}
                {tr("records")}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (page > 1) {
                      setPage(page - 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  <FiChevronLeft className="text-sm" />
                  <span className="hidden sm:inline">{tr("Previous")}</span>
                </button>

                {/* Page number buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`dots-${idx}`}
                        className="px-2 text-xs"
                        style={{ color: "var(--text3)" }}
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => {
                          setPage(p);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`w-8 h-8 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition cursor-pointer ${
                          page === p
                            ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
                            : "border hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                        style={
                          page === p
                            ? {}
                            : { borderColor: "var(--border)", color: "var(--text)" }
                        }
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => {
                    if (page < totalPages) {
                      setPage(page + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  <span className="hidden sm:inline">{tr("Next")}</span>
                  <FiChevronRight className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Popup Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl relative"
            style={{
              background: "var(--bg3)",
              borderColor: "var(--border)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <h2 className="text-lg font-extrabold" style={{ color: "var(--text)" }}>
                  {tr("Booking Details")}
                </h2>
                <p className="text-xs" style={{ color: "var(--text3)" }}>
                  {tr("Full information of this completed booking")}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Close"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Status & Booking ID */}
            {(() => {
              const bId =
                selectedRecord.bookingId ||
                (selectedRecord.booking && typeof selectedRecord.booking === "object"
                  ? selectedRecord.booking.bookingId
                  : selectedRecord.booking) ||
                "";
              const statusMeta =
                statusConfig[selectedRecord.status] || {
                  badge: "bg-gray-100 text-gray-700",
                  dot: "bg-gray-400",
                  label: selectedRecord.status,
                };

              return (
                <div
                  className="flex items-center justify-between gap-2 p-3 rounded-xl"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badge}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                    {tr(statusMeta.label || selectedRecord.status)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">
                      ID:
                    </span>
                    <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                      {bId || "—"}
                    </span>
                    {bId && (
                      <button
                        onClick={(e) => handleCopy(bId, e)}
                        title={tr("Copy Booking ID")}
                        className="p-1 text-gray-400 hover:text-violet-500 transition"
                      >
                        {copiedId === bId ? (
                          <FiCheck className="text-emerald-500 text-xs" />
                        ) : (
                          <FiCopy className="text-xs" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Material Details */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-500">
                {tr("Material Title")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {getMaterialIcon(selectedRecord.material)}
                </span>
                <div>
                  <h3
                    className="text-base font-extrabold"
                    style={{ color: "var(--text)" }}
                  >
                    {selectedRecord.title || selectedRecord.material || "Material booking"}
                  </h3>
                  {selectedRecord.material && (
                    <p className="text-xs" style={{ color: "var(--text3)" }}>
                      {selectedRecord.material}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div
              className="grid grid-cols-2 gap-3 p-3.5 rounded-xl text-xs sm:text-sm"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Customer */}
              <div className="space-y-0.5">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1"
                  style={{ color: "var(--text3)" }}
                >
                  <FiUser className="text-violet-500" /> {tr("Customer")}
                </span>
                <p className="font-bold truncate" style={{ color: "var(--text)" }}>
                  {selectedRecord.customerName || "—"}
                </p>
              </div>

              {/* Contact */}
              <div className="space-y-0.5">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1"
                  style={{ color: "var(--text3)" }}
                >
                  <FiPhone className="text-violet-500" /> {tr("Contact")}
                </span>
                <p className="font-bold truncate" style={{ color: "var(--text)" }}>
                  {selectedRecord.customerPhone ? (
                    <a
                      href={`tel:${selectedRecord.customerPhone}`}
                      className="hover:text-violet-500 transition-colors"
                    >
                      {selectedRecord.customerPhone}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>

              {/* Quantity */}
              <div className="space-y-0.5">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1"
                  style={{ color: "var(--text3)" }}
                >
                  <FiPackage className="text-violet-500" /> {tr("Quantity")}
                </span>
                <p className="font-bold" style={{ color: "var(--text)" }}>
                  {getQuantityLabel(selectedRecord)}
                </p>
              </div>

              {/* Total Amount */}
              <div className="space-y-0.5">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text3)" }}
                >
                  {tr("Total Amount")}
                </span>
                <p className="font-black text-emerald-600 dark:text-emerald-400">
                  {selectedRecord.estimatedAmount
                    ? `₹${Number(selectedRecord.estimatedAmount).toLocaleString("en-IN")}`
                    : "—"}
                </p>
              </div>

              {/* Email if present */}
              {selectedRecord.customerEmail && (
                <div className="col-span-2 space-y-0.5 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1"
                    style={{ color: "var(--text3)" }}
                  >
                    <FiMail className="text-violet-500" /> {tr("Email")}
                  </span>
                  <p className="font-medium" style={{ color: "var(--text2)" }}>
                    {selectedRecord.customerEmail}
                  </p>
                </div>
              )}

              {/* Delivery / Update Date */}
              <div className="col-span-2 space-y-0.5 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1"
                  style={{ color: "var(--text3)" }}
                >
                  <FiCalendar className="text-violet-500" /> {tr("Delivery / Closure Date")}
                </span>
                <p className="font-medium" style={{ color: "var(--text2)" }}>
                  {new Date(
                    selectedRecord.updatedAt || selectedRecord.createdAt
                  ).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>

            {/* Assigned Driver (if present) */}
            {selectedRecord.driverData?.name && (
              <div
                className="flex items-center gap-2 text-xs p-3 rounded-xl"
                style={{
                  background: "rgba(124, 58, 237, 0.08)",
                  border: "1px solid rgba(124, 58, 237, 0.2)",
                  color: "var(--text2)",
                }}
              >
                <FiTruck className="text-violet-500 text-base flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-violet-600 dark:text-violet-400">
                    {tr("Assigned Driver")}
                  </p>
                  <p className="font-bold" style={{ color: "var(--text)" }}>
                    {selectedRecord.driverData.name}{" "}
                    {selectedRecord.driverData.phone && (
                      <span className="font-normal opacity-80">
                        ({selectedRecord.driverData.phone})
                      </span>
                    )}
                  </p>
                  {selectedRecord.driverData.vehicle && (
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-violet-500/15 font-mono text-[10px] font-bold text-violet-500">
                      {selectedRecord.driverData.vehicle}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Reason / Completion Note */}
            {selectedRecord.status === "Rejected" && (
              <div className="rounded-xl p-3 text-xs border bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
                <FiXCircle className="text-base flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{tr("Rejection Reason")}: </span>
                  <span>{selectedRecord.reason || tr("No rejection reason provided")}</span>
                </div>
              </div>
            )}

            {selectedRecord.status === "Revoked" && (
              <div className="rounded-xl p-3 text-xs border bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-start gap-2.5">
                <FiAlertCircle className="text-base flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{tr("Revocation Reason")}: </span>
                  <span>{selectedRecord.reason || tr("No revocation reason provided")}</span>
                </div>
              </div>
            )}

            {selectedRecord.status === "Delivered" && (
              <div className="rounded-xl p-3 text-xs border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5">
                <FiCheckCircle className="text-base flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{tr("Status")}: </span>
                  <span>
                    {selectedRecord.reason ||
                      tr("Successfully delivered to the customer destination.")}
                  </span>
                </div>
              </div>
            )}

            {["CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "Cancelled by User", "Cancelled by Admin"].includes(selectedRecord.status) && (
              <div className="rounded-xl p-3.5 text-xs border bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <FiXCircle className="text-base flex-shrink-0" />
                    {selectedRecord.status === "CANCELLED_BY_USER" || selectedRecord.status === "Cancelled by User"
                      ? tr("Cancelled by Customer")
                      : tr("Cancelled by Admin")}
                  </span>
                  {selectedRecord.cancelledAt && (
                    <span className="text-[10px] opacity-80">
                      {new Date(selectedRecord.cancelledAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium pl-5" style={{ color: "var(--text)" }}>
                  <span className="font-bold">{tr("Cancellation Reason")}: </span>
                  {selectedRecord.cancellationReason || selectedRecord.reason || tr("No reason provided")}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div
              className="flex items-center justify-between gap-3 pt-3 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                onClick={(e) => deleteBookings([selectedRecord._id], e)}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition-all disabled:opacity-40 cursor-pointer"
              >
                <FiTrash2 className="text-xs" />
                {tr("Delete Record")}
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border hover:bg-white/5 transition cursor-pointer"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                {tr("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
