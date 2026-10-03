// src/pages/admin/Dashboard.jsx
import { useState, useEffect, useMemo } from "react";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiTruck,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiPieChart,
  FiBarChart2,
  FiActivity,
  FiRotateCcw,
  FiXOctagon,
} from "react-icons/fi";
import { LuIndianRupee } from "react-icons/lu";
import { DashboardSkeleton } from "../../components/AdminSkeletons";

const BOOKING_STATUS_STYLES = {
  Delivered: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  Confirmed: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  Pending: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  Revoked: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  Rejected: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  CANCELLED_BY_USER: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  CANCELLED_BY_ADMIN: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  "Cancelled by User": "bg-rose-500/15 text-rose-500 border-rose-500/30",
  "Cancelled by Admin": "bg-rose-500/15 text-rose-500 border-rose-500/30",
};

/**
 * Format currency with Indian numbering rules.
 * If amount has more than 5 digits (>= 100,000 / 1 Lakh), formats to short form (e.g. ₹1.2 L, ₹5.5 L).
 */
export const formatAmount = (val) => {
  const num = Number(val) || 0;
  if (num >= 10000000) {
    const cr = num / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    const l = num / 100000;
    return `₹${l % 1 === 0 ? l : l.toFixed(1)} L`;
  }
  return `₹${num.toLocaleString("en-IN")}`;
};

const getMaterialIcon = (material) => {
  if (material === "Bricks") return "🧱";
  if (material === "Dry Grass Rolls") return "🌾";
  if (material === "River Sand") return "🏖️";
  if (material === "M-Sand") return "⛏️";
  return "📦";
};

const MATERIAL_COLORS = {
  Bricks: {
    gradient: "from-orange-500 to-amber-500",
    barColor: "linear-gradient(90deg, #f97316, #f59e0b)",
    textColor: "text-orange-500",
  },
  "M-Sand": {
    gradient: "from-purple-500 to-violet-600",
    barColor: "linear-gradient(90deg, #a855f7, #7c3aed)",
    textColor: "text-purple-500",
  },
  "River Sand": {
    gradient: "from-blue-500 to-cyan-500",
    barColor: "linear-gradient(90deg, #3b82f6, #06b6d4)",
    textColor: "text-blue-500",
  },
  "Dry Grass Rolls": {
    gradient: "from-emerald-500 to-teal-500",
    barColor: "linear-gradient(90deg, #10b981, #14b8a6)",
    textColor: "text-emerald-500",
  },
  Other: {
    gradient: "from-gray-500 to-slate-600",
    barColor: "linear-gradient(90deg, #6b7280, #475569)",
    textColor: "text-gray-400",
  },
};

export default function Dashboard() {
  const { tr } = useTheme();
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, rejected: 0 });
  const [goods, setGoods] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePoint, setActivePoint] = useState(null);
  const [activeBar, setActiveBar] = useState(null);
  const [activePieSegment, setActivePieSegment] = useState(null);
  const [pieFilterTab, setPieFilterTab] = useState("month");
  const [materialFilterTab, setMaterialFilterTab] = useState("month");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get("/bookings/stats").catch(() => ({ data: { total: 0, pending: 0, confirmed: 0, rejected: 0 } })),
      API.get("/goods").catch(() => ({ data: [] })),
      API.get("/drivers").catch(() => ({ data: [] })),
      API.get("/bookings").catch(() => ({ data: [] })),
      API.get("/admin-history").catch(() => ({ data: [] })),
    ])
      .then(([s, g, d, b, h]) => {
        setStats(s.data || { total: 0, pending: 0, confirmed: 0, rejected: 0 });
        setGoods(Array.isArray(g.data) ? g.data : []);
        setDrivers(Array.isArray(d.data) ? d.data : []);
        setBookings(Array.isArray(b.data) ? b.data : []);
        setHistory(Array.isArray(h.data) ? h.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Consolidate all records with latest status from database
  const allRecords = useMemo(() => {
    const list = [...bookings];
    history.forEach((h) => {
      const bookingRefId = h.booking?._id || h.booking || h._id;
      const existingIdx = list.findIndex((b) => String(b._id) === String(bookingRefId));
      if (existingIdx >= 0) {
        if (h.status && list[existingIdx].status !== h.status) {
          list[existingIdx] = {
            ...list[existingIdx],
            status: h.status,
            updatedAt: h.updatedAt || list[existingIdx].updatedAt,
          };
        }
      } else {
        list.push({
          ...h,
          _id: h._id,
          createdAt: h.createdAt || new Date(),
          updatedAt: h.updatedAt || h.createdAt || new Date(),
          estimatedAmount: Number(h.estimatedAmount) || 0,
          goodsData: { material: h.material, title: h.title },
        });
      }
    });
    return list;
  }, [bookings, history]);

  // Income calculations - ONLY count if status is Delivered
  const { thisMonthIncome, lastMonthIncome, allTimeIncome } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let thisMonth = 0;
    let lastMonthVal = 0;
    let total = 0;

    allRecords.forEach((record) => {
      const amount = Number(record.estimatedAmount) || 0;
      const d = new Date(record.updatedAt || record.createdAt);

      // Only add money if booking status is Delivered
      if (record.status === "Delivered") {
        total += amount;

        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          thisMonth += amount;
        } else if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
          lastMonthVal += amount;
        }
      }
    });

    return {
      thisMonthIncome: thisMonth,
      lastMonthIncome: lastMonthVal,
      allTimeIncome: total,
    };
  }, [allRecords]);

  // Percentage compared to previous month with increase/decrease indicator
  const monthComparison = useMemo(() => {
    if (lastMonthIncome === 0) {
      if (thisMonthIncome === 0) {
        return { isIncrease: true, sign: "+", pct: 0, text: "+0%" };
      }
      return { isIncrease: true, sign: "+", pct: 100, text: "+100%" };
    }
    const diff = thisMonthIncome - lastMonthIncome;
    const isIncrease = diff >= 0;
    const rawPct = Math.round(Math.abs((diff / lastMonthIncome) * 100));
    const clampedPct = Math.min(100, rawPct);
    const sign = isIncrease ? "+" : "-";
    return {
      isIncrease,
      sign,
      pct: clampedPct,
      text: `${sign}${clampedPct}%`,
    };
  }, [thisMonthIncome, lastMonthIncome]);

  // 5 Columns Status counts for THIS MONTH ONLY
  const thisMonthStatus = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const counts = {
      Pending: 0,
      Confirmed: 0,
      Delivered: 0,
      Revoked: 0,
      Rejected: 0,
    };

    allRecords.forEach((r) => {
      const d = new Date(r.updatedAt || r.createdAt);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (counts[r.status] !== undefined) {
          counts[r.status]++;
        }
      }
    });

    return counts;
  }, [allRecords]);

  // Driver Counts from actual database data
  const driverCounts = useMemo(() => {
    const available = drivers.filter((d) => d.status === "Available").length;
    return { available };
  }, [drivers]);

  // Status Distribution for Pie / Donut Chart (Actual DB data based on pieFilterTab)
  const statusDistribution = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const counts = {
      Delivered: 0,
      Confirmed: 0,
      Pending: 0,
      Rejected: 0,
      Revoked: 0,
    };

    allRecords.forEach((r) => {
      if (pieFilterTab === "month") {
        const d = new Date(r.updatedAt || r.createdAt);
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) {
          return;
        }
      }
      if (counts[r.status] !== undefined) {
        counts[r.status]++;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return [
      { status: "Delivered", count: counts.Delivered, color: "#10b981", pct: total > 0 ? Math.round((counts.Delivered / total) * 100) : 0 },
      { status: "Confirmed", count: counts.Confirmed, color: "#3b82f6", pct: total > 0 ? Math.round((counts.Confirmed / total) * 100) : 0 },
      { status: "Pending",   count: counts.Pending,   color: "#f59e0b", pct: total > 0 ? Math.round((counts.Pending / total) * 100) : 0 },
      { status: "Rejected",  count: counts.Rejected,  color: "#f43f5e", pct: total > 0 ? Math.round((counts.Rejected / total) * 100) : 0 },
      { status: "Revoked",   count: counts.Revoked,   color: "#f97316", pct: total > 0 ? Math.round((counts.Revoked / total) * 100) : 0 },
    ];
  }, [allRecords, pieFilterTab]);

  // Material Earnings Ranking (Delivered only, real DB data based on materialFilterTab)
  const materialEarnings = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const map = {
      Bricks: 0,
      "M-Sand": 0,
      "River Sand": 0,
      "Dry Grass Rolls": 0,
    };

    allRecords.forEach((r) => {
      const mat = r.goodsData?.material || r.material;
      const amt = Number(r.estimatedAmount) || 0;
      if (mat && map[mat] !== undefined && r.status === "Delivered") {
        if (materialFilterTab === "month") {
          const d = new Date(r.updatedAt || r.createdAt);
          if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) {
            return;
          }
        }
        map[mat] += amt;
      }
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0);

    return {
      total,
      list: Object.entries(map)
        .map(([material, amount]) => ({
          material,
          amount,
          percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
          icon: getMaterialIcon(material),
        }))
        .sort((a, b) => b.amount - a.amount),
    };
  }, [allRecords, materialFilterTab]);

  // Monthly data for Bar Chart and Graph Chart (Last 6 Months from actual DB)
  const monthlyTrendData = useMemo(() => {
    const result = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const monthLabel = d.toLocaleDateString("en-IN", { month: "short" });

      let rev = 0;
      let orderCount = 0;

      allRecords.forEach((record) => {
        const rd = new Date(record.updatedAt || record.createdAt);
        if (rd.getMonth() === mIdx && rd.getFullYear() === yr) {
          orderCount++;
          if (record.status === "Delivered") {
            rev += Number(record.estimatedAmount) || 0;
          }
        }
      });

      result.push({
        month: monthLabel,
        revenue: rev,
        orders: orderCount,
      });
    }

    return result;
  }, [allRecords]);

  // Max value for Bar Chart Scaling
  const maxRevenue = useMemo(() => {
    const highest = Math.max(...monthlyTrendData.map((d) => d.revenue), 0);
    return highest > 0 ? highest : 1000;
  }, [monthlyTrendData]);

  // Average monthly revenue
  const averageMonthlyRevenue = useMemo(() => {
    const total = monthlyTrendData.reduce((acc, curr) => acc + curr.revenue, 0);
    return Math.round(total / (monthlyTrendData.length || 1));
  }, [monthlyTrendData]);

  // Generate SVG Bezier Path for Line Graph
  const lineGraphSvg = useMemo(() => {
    const W = 580;
    const H = 200;
    const padL = 40;
    const padR = 20;
    const padT = 25;
    const padB = 30;

    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const points = monthlyTrendData.map((d, i) => {
      const x = padL + (i / (monthlyTrendData.length - 1)) * plotW;
      const y = padT + plotH - (d.revenue / maxRevenue) * plotH;
      return { x, y, ...d };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${H - padB} L ${points[0].x} ${H - padB} Z`;

    return { points, pathD, areaD, W, H, padB };
  }, [monthlyTrendData, maxRevenue]);

  return (
    <div className="w-full max-w-[1300px] mx-auto space-y-6 pb-16">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs uppercase font-extrabold tracking-widest text-violet-500">Live Management Portal</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-0.5" style={{ color: "var(--text)" }}>
            {tr("Admin Dashboard")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text3)" }}>
            Real-time analytics, revenue tracking, and material performance
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border self-start sm:self-auto" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text2)" }}>
          <FiCalendar className="text-violet-500" />
          <span>{new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* ── 1. THIS MONTH INCOME CARD ── */}
          <div
        className="rounded-2xl p-4 sm:p-6 border relative overflow-hidden shadow-lg transition-transform hover:scale-[1.005]"
        style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.10) 50%, var(--surface) 100%)",
          borderColor: "rgba(139, 92, 246, 0.35)",
        }}
      >
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-violet-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 sm:p-2.5 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30 shrink-0">
              <LuIndianRupee className="text-lg sm:text-xl" />
            </span>
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-violet-400">
              THIS MONTH INCOME
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-full border shadow-xs ${
                monthComparison.isIncrease
                  ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-500 border-rose-500/30"
              }`}
            >
              {monthComparison.isIncrease ? (
                <FiTrendingUp className="text-sm shrink-0" />
              ) : (
                <FiTrendingDown className="text-sm shrink-0" />
              )}
              <span>{monthComparison.text}</span>
            </span>

            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wide uppercase whitespace-nowrap"
              style={{
                background: "var(--bg3)",
                borderColor: "var(--border)",
                color: "var(--text3)",
              }}
            >
              {tr("vs previous month")}
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-baseline">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight" style={{ color: "var(--text)" }}>
            {formatAmount(thisMonthIncome)}
          </h2>
        </div>

        <div
          className="mt-4 pt-3 border-t text-xs font-medium flex flex-wrap items-center justify-between gap-2"
          style={{ borderColor: "var(--border)", color: "var(--text3)" }}
        >
          <span>All-Time Revenue:</span>
          <strong className="text-emerald-500 font-bold text-sm">{formatAmount(allTimeIncome)}</strong>
        </div>
      </div>

      {/* ── 2. CARD WITH 4 COLUMNS: PENDING, CONFIRMED, REVOKED, REJECTED (THIS MONTH ONLY) ── */}
      <div
        className="rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="text-base font-extrabold" style={{ color: "var(--text)" }}>
              {tr("This Month Order Status")}
            </h3>
            <p className="text-xs" style={{ color: "var(--text3)" }}>
              Active and processed bookings for {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 self-start sm:self-auto">
            {thisMonthStatus.Pending + thisMonthStatus.Confirmed + thisMonthStatus.Delivered + thisMonthStatus.Revoked + thisMonthStatus.Rejected} Total This Month
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Column 1: Pending */}
          <div
            className="p-4 rounded-xl border flex flex-col justify-between transition hover:border-amber-500/40 hover:bg-amber-500/[0.03]"
            style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                Pending
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <FiClock className="text-base" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-500">
              {thisMonthStatus.Pending}
            </p>
            <span className="text-[11px] mt-1" style={{ color: "var(--text3)" }}>
              Awaiting confirmation
            </span>
          </div>

          {/* Column 2: Confirmed */}
          <div
            className="p-4 rounded-xl border flex flex-col justify-between transition hover:border-blue-500/40 hover:bg-blue-500/[0.03]"
            style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
                Confirmed
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <FiCheckCircle className="text-base" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-blue-500">
              {thisMonthStatus.Confirmed}
            </p>
            <span className="text-[11px] mt-1" style={{ color: "var(--text3)" }}>
              Driver assigned / En route
            </span>
          </div>

          {/* Column 3: Delivered */}
          <div
            className="p-4 rounded-xl border flex flex-col justify-between transition hover:border-emerald-500/40 hover:bg-emerald-500/[0.03]"
            style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Delivered
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <FiPackage className="text-base" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-500">
              {thisMonthStatus.Delivered}
            </p>
            <span className="text-[11px] mt-1" style={{ color: "var(--text3)" }}>
              Successfully completed
            </span>
          </div>

          {/* Column 4: Revoked */}
          <div
            className="p-4 rounded-xl border flex flex-col justify-between transition hover:border-orange-500/40 hover:bg-orange-500/[0.03]"
            style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Revoked
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-500 flex items-center justify-center">
                <FiRotateCcw className="text-base" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-orange-500">
              {thisMonthStatus.Revoked}
            </p>
            <span className="text-[11px] mt-1" style={{ color: "var(--text3)" }}>
              Cancelled / Stock restored
            </span>
          </div>

          {/* Column 5: Rejected */}
          <div
            className="p-4 rounded-xl border flex flex-col justify-between transition hover:border-rose-500/40 hover:bg-rose-500/[0.03]"
            style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                Rejected
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <FiXOctagon className="text-base" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-rose-500">
              {thisMonthStatus.Rejected}
            </p>
            <span className="text-[11px] mt-1" style={{ color: "var(--text3)" }}>
              Declined orders
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. CARD: AVAILABLE DRIVERS ── */}
      <div
        className="rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 flex items-center justify-center text-lg">
              <FiTruck />
            </div>
            <div>
              <h3 className="text-base font-extrabold" style={{ color: "var(--text)" }}>
                {tr("Available Driver Counts")}
              </h3>
              <p className="text-xs" style={{ color: "var(--text3)" }}>
                Real-time transport driver status from database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-500">
              {driverCounts.available} Available for immediate dispatch
            </span>
          </div>
        </div>

        {/* Available Drivers Main Focused Tile */}
        <div
          className="p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-emerald-500/40"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, var(--bg3) 100%)",
            borderColor: "rgba(16, 185, 129, 0.3)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Available Drivers
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Ready
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--text3)" }}>
              Active drivers currently available and ready for immediate load assignment
            </p>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-500">
              {driverCounts.available}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. ORDER STATUS PIE CHART (SEPARATE CARD WITH TABS) ── */}
      <div
        className="rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <FiPieChart className="text-lg" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold truncate" style={{ color: "var(--text)" }}>
                {tr("Order Status Pie Chart")}
              </h3>
              <p className="text-xs truncate" style={{ color: "var(--text3)" }}>
                {pieFilterTab === "month"
                  ? `Status distribution and fulfillment metrics for ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
                  : "All-time status distribution and cumulative fulfillment metrics"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Filter Tabs: This Month Analysis & Overall Analysis */}
            <div
              className="inline-flex items-center p-1 rounded-xl border shadow-inner"
              style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
            >
              <button
                type="button"
                onClick={() => {
                  setPieFilterTab("month");
                  setActivePieSegment(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  pieFilterTab === "month"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <FiCalendar className="text-sm" />
                <span>{tr("This Month Analysis")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPieFilterTab("overall");
                  setActivePieSegment(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  pieFilterTab === "overall"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <FiActivity className="text-sm" />
                <span>{tr("Overall Analysis")}</span>
              </button>
            </div>

            <span className="text-xs font-bold text-violet-400 shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              {statusDistribution.reduce((a, b) => a + b.count, 0)} {tr("Orders")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-2">
          {/* SVG Donut Chart */}
          <div className="relative flex items-center justify-center py-2">
            <svg viewBox="0 0 200 200" className="w-48 h-48 -rotate-90">
              {(() => {
                const totalOrders = statusDistribution.reduce((a, b) => a + b.count, 0);

                if (totalOrders === 0) {
                  return (
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke="var(--border)"
                      strokeWidth="18"
                    />
                  );
                }

                let accumulatedPct = 0;
                const radius = 70;
                const circumference = 2 * Math.PI * radius;

                return statusDistribution.map((seg) => {
                  const strokeDasharray = `${(seg.pct / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((accumulatedPct / 100) * circumference);
                  accumulatedPct += seg.pct;

                  const isHovered = activePieSegment === seg.status;

                  return (
                    <circle
                      key={seg.status}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={isHovered ? "22" : "18"}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setActivePieSegment(seg.status)}
                      onMouseLeave={() => setActivePieSegment(null)}
                    />
                  );
                });
              })()}
            </svg>

            {/* Donut Center Total Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black" style={{ color: "var(--text)" }}>
                {statusDistribution.reduce((a, b) => a + b.count, 0)}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text3)" }}>
                {pieFilterTab === "month" ? "This Month" : "Total Orders"}
              </span>
            </div>
          </div>

          {/* Interactive Legends */}
          <div className="space-y-2.5">
            {statusDistribution.map((item) => (
              <div
                key={item.status}
                onMouseEnter={() => setActivePieSegment(item.status)}
                onMouseLeave={() => setActivePieSegment(null)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                  activePieSegment === item.status ? "border-violet-500/50 bg-white/5" : ""
                }`}
                style={{ borderColor: "var(--border)", background: "var(--bg3)" }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-xs sm:text-sm font-bold" style={{ color: "var(--text)" }}>
                    {tr(item.status)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold" style={{ color: "var(--text3)" }}>
                    {item.count} orders
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: `${item.color}20`, color: item.color }}>
                    {item.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. TOP EARNING MATERIALS (SEPARATE CARD WITH TABS) ── */}
      <div
        className="rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-base shadow-sm shrink-0">
              <FiActivity />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold truncate" style={{ color: "var(--text)" }}>
                {tr("Top Earning Materials")}
              </h2>
              <p className="text-xs truncate" style={{ color: "var(--text3)" }}>
                {materialFilterTab === "month"
                  ? `Delivered revenue contribution by material for ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
                  : "All-time delivered revenue contribution by material type"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Filter Tabs: This Month Analysis & Overall Analysis */}
            <div
              className="inline-flex items-center p-1 rounded-xl border shadow-inner"
              style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
            >
              <button
                type="button"
                onClick={() => setMaterialFilterTab("month")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  materialFilterTab === "month"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <FiCalendar className="text-sm" />
                <span>{tr("This Month Analysis")}</span>
              </button>
              <button
                type="button"
                onClick={() => setMaterialFilterTab("overall")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  materialFilterTab === "overall"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <FiActivity className="text-sm" />
                <span>{tr("Overall Analysis")}</span>
              </button>
            </div>

            <span className="text-xs font-bold text-emerald-400 shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              {formatAmount(materialEarnings.total)}
            </span>
          </div>
        </div>

        {/* Straight line bar structure */}
        <div className="space-y-4 pt-1">
          {materialEarnings.list.map((item, idx) => {
            const styleMeta = MATERIAL_COLORS[item.material] || MATERIAL_COLORS.Other;

            return (
              <div
                key={item.material}
                className="p-3.5 rounded-xl border transition-all duration-150 hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border)", background: "var(--bg3)" }}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-xs font-extrabold flex items-center justify-center text-violet-400 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm truncate" style={{ color: "var(--text)" }}>
                        {tr(item.material)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-base sm:text-lg font-black text-emerald-500">
                      {formatAmount(item.amount)}
                    </span>
                    <span className="text-xs ml-2 font-bold opacity-75" style={{ color: "var(--text3)" }}>
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>

                <div className="w-full h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden relative p-[1px]">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                    style={{
                      width: `${item.percentage}%`,
                      background: styleMeta.barColor,
                      boxShadow: item.percentage > 0 ? "0 0 12px rgba(249, 115, 22, 0.4)" : "none",
                    }}
                  >
                    {item.percentage > 0 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. CHARTS: REVENUE TREND GRAPH & MONTHLY INCOME BAR CHART ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH CHART */}
        <div
          className="rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between border-b pb-3 gap-2" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0">
                <FiTrendingUp className="text-base" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold truncate" style={{ color: "var(--text)" }}>
                  {tr("Revenue Trend Graph")}
                </h3>
                <p className="text-xs truncate" style={{ color: "var(--text3)" }}>
                  Monthly delivered revenue trajectory (Last 6 Months)
                </p>
              </div>
            </div>
          </div>

          <div className="relative w-full pt-2">
            <svg
              viewBox={`0 0 ${lineGraphSvg.W} ${lineGraphSvg.H}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75, 1].map((lvl) => {
                const y = lineGraphSvg.H - lineGraphSvg.padB - lvl * (lineGraphSvg.H - 55);
                return (
                  <line
                    key={lvl}
                    x1="40"
                    y1={y}
                    x2={lineGraphSvg.W - 20}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              <path d={lineGraphSvg.areaD} fill="url(#curveGradient)" />

              <path
                d={lineGraphSvg.pathD}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {lineGraphSvg.points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={activePoint?.month === pt.month ? "6.5" : "4.5"}
                    fill="#13131f"
                    stroke="#a78bfa"
                    strokeWidth="3"
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setActivePoint(pt)}
                    onMouseLeave={() => setActivePoint(null)}
                    onClick={() => setActivePoint((prev) => (prev?.month === pt.month ? null : pt))}
                  />
                  {activePoint?.month === pt.month && (
                    <g className="pointer-events-none">
                      <rect
                        x={pt.x - 38}
                        y={Math.max(pt.y - 30, 2)}
                        width="76"
                        height="20"
                        rx="6"
                        fill="#1e1b4b"
                        stroke="#8b5cf6"
                        strokeWidth="1.2"
                      />
                      <text
                        x={pt.x}
                        y={Math.max(pt.y - 16, 16)}
                        textAnchor="middle"
                        fill="#e0e7ff"
                        fontSize="10"
                        fontWeight="700"
                      >
                        {formatAmount(pt.revenue)}
                      </text>
                    </g>
                  )}
                  <text
                    x={pt.x}
                    y={lineGraphSvg.H - 8}
                    textAnchor="middle"
                    fill={activePoint?.month === pt.month ? "#a78bfa" : "var(--text3)"}
                    fontSize="11"
                    fontWeight="600"
                  >
                    {pt.month}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: "var(--border)", color: "var(--text3)" }}>
            <span>Base: ₹0</span>
            {activePoint ? (
              <span className="font-bold text-violet-400">
                {activePoint.month}: <strong className="text-emerald-400">{formatAmount(activePoint.revenue)}</strong>
              </span>
            ) : (
              <span>Peak: {formatAmount(Math.max(...monthlyTrendData.map((d) => d.revenue), 0))}</span>
            )}
          </div>
        </div>

        {/* BAR CHART */}
        <div
          className="rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between border-b pb-3 gap-2" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <FiBarChart2 className="text-base" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold truncate" style={{ color: "var(--text)" }}>
                  {tr("Monthly Income Bar Chart")}
                </h3>
                <p className="text-xs truncate" style={{ color: "var(--text3)" }}>
                  Delivered volume comparison across billing months
                </p>
              </div>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2">
            {monthlyTrendData.map((d) => {
              const heightPct = d.revenue > 0 ? Math.max(Math.round((d.revenue / maxRevenue) * 100), 10) : 4;
              const isHovered = activeBar?.month === d.month;

              return (
                <div
                  key={d.month}
                  className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                  onMouseEnter={() => setActiveBar(d)}
                  onMouseLeave={() => setActiveBar(null)}
                  onClick={() => setActiveBar((prev) => (prev?.month === d.month ? null : d))}
                >
                  <span
                    className={`text-[10px] font-bold text-violet-400 transition-opacity ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {formatAmount(d.revenue)}
                  </span>

                  <div className="w-full max-w-[42px] h-32 rounded-xl bg-white/5 border border-white/5 flex items-end p-1 overflow-hidden">
                    <div
                      className="w-full rounded-lg transition-all duration-500 ease-out"
                      style={{
                        height: `${heightPct}%`,
                        background: isHovered
                          ? "linear-gradient(180deg, #38bdf8 0%, #2563eb 100%)"
                          : d.revenue > 0
                          ? "linear-gradient(180deg, #818cf8 0%, #4f46e5 100%)"
                          : "rgba(255, 255, 255, 0.1)",
                        boxShadow: isHovered && d.revenue > 0 ? "0 0 14px rgba(56, 189, 248, 0.5)" : "none",
                      }}
                    />
                  </div>

                  <span
                    className={`text-xs font-bold transition-colors ${
                      isHovered ? "text-violet-400" : ""
                    }`}
                    style={{ color: isHovered ? undefined : "var(--text3)" }}
                  >
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: "var(--border)", color: "var(--text3)" }}>
            {activeBar ? (
              <span className="font-bold text-blue-400">
                {activeBar.month}: <strong className="text-emerald-400">{formatAmount(activeBar.revenue)}</strong>
              </span>
            ) : (
              <span>This Month: <strong className="text-emerald-500">{formatAmount(thisMonthIncome)}</strong></span>
            )}
            <span>Average: {formatAmount(averageMonthlyRevenue)}/mo</span>
          </div>
        </div>
      </div>

      {/* ── 7. RECENT BOOKINGS FEED ── */}
      <div
        className="rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="text-base font-extrabold" style={{ color: "var(--text)" }}>
              {tr("Recent Bookings Feed")}
            </h3>
            <p className="text-xs" style={{ color: "var(--text3)" }}>
              Latest transport booking activity
            </p>
          </div>
          <span className="text-xs font-bold text-violet-400">
            {bookings.length} Total Active
          </span>
        </div>

        {bookings.length === 0 ? (
          <p className="py-10 text-center text-sm" style={{ color: "var(--text3)" }}>
            {tr("No bookings recorded yet.")}
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {bookings.slice(0, 5).map((b) => (
              <div key={b._id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center text-base flex-shrink-0">
                    {getMaterialIcon(b.goodsData?.material)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm truncate" style={{ color: "var(--text)" }}>
                      {b.goodsData?.title || b.goodsData?.material || "Transport Booking"}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text3)" }}>
                      Customer: {b.customerName || `${b.user?.firstName || ""} ${b.user?.lastName || ""}`.trim() || "Guest"}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-black text-sm text-emerald-500">
                    {formatAmount(b.estimatedAmount)}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      BOOKING_STATUS_STYLES[b.status] || "bg-violet-500/15 text-violet-400 border-violet-500/30"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

