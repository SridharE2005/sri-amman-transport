// src/components/AdminSkeletons.jsx
import React from "react";

/**
 * Shimmer element helper
 */
export function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`skeleton-shimmer rounded-lg ${className}`}
      style={{
        background: "var(--bg3)",
        ...style,
      }}
    />
  );
}

/**
 * 1. DASHBOARD SKELETON
 */
export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* ── 1. Hero Revenue Card Skeleton ── */}
      <div
        className="rounded-2xl p-5 sm:p-6 border relative overflow-hidden shadow-lg space-y-4"
        style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(59, 130, 246, 0.05) 50%, var(--surface) 100%)",
          borderColor: "rgba(139, 92, 246, 0.25)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-36 h-5 rounded-md" />
          </div>
          <Skeleton className="w-28 h-6 rounded-full" />
        </div>

        <div className="mt-3">
          <Skeleton className="w-48 sm:w-64 h-12 rounded-xl" />
        </div>

        <div
          className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2"
          style={{ borderColor: "var(--border)" }}
        >
          <Skeleton className="w-32 h-4 rounded-md" />
          <Skeleton className="w-24 h-5 rounded-md" />
        </div>
      </div>

      {/* ── 2. 5 Columns Status Card Skeleton ── */}
      <div
        className="rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
          <div className="space-y-1.5">
            <Skeleton className="w-44 h-5 rounded-md" />
            <Skeleton className="w-60 h-3.5 rounded-md" />
          </div>
          <Skeleton className="w-32 h-6 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border flex flex-col justify-between space-y-3"
              style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <Skeleton className="w-16 h-3.5 rounded" />
                <Skeleton className="w-7 h-7 rounded-lg" />
              </div>
              <Skeleton className="w-12 h-8 rounded-lg" />
              <Skeleton className="w-24 h-3 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Charts Row Skeleton ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Left Chart Card */}
        <div
          className="rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div className="space-y-1.5">
              <Skeleton className="w-36 h-5 rounded-md" />
              <Skeleton className="w-48 h-3.5 rounded-md" />
            </div>
            <Skeleton className="w-24 h-8 rounded-xl" />
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2">
            {[40, 75, 55, 90, 65, 80].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <Skeleton className="w-full rounded-t-lg" style={{ height: `${h}%` }} />
                <Skeleton className="w-8 h-3 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Chart Card */}
        <div
          className="rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div className="space-y-1.5">
              <Skeleton className="w-40 h-5 rounded-md" />
              <Skeleton className="w-52 h-3.5 rounded-md" />
            </div>
            <Skeleton className="w-28 h-8 rounded-xl" />
          </div>

          <div className="h-56 flex items-center justify-center gap-6">
            <Skeleton className="w-36 h-36 rounded-full" />
            <div className="space-y-2.5 flex-1 max-w-[160px]">
              <Skeleton className="w-full h-4 rounded" />
              <Skeleton className="w-3/4 h-4 rounded" />
              <Skeleton className="w-5/6 h-4 rounded" />
              <Skeleton className="w-2/3 h-4 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Drivers Fleet Skeleton ── */}
      <div
        className="rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
          <div className="space-y-1">
            <Skeleton className="w-48 h-5 rounded-md" />
            <Skeleton className="w-64 h-3.5 rounded-md" />
          </div>
          <Skeleton className="w-20 h-6 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border flex items-center gap-3"
              style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
            >
              <Skeleton className="w-11 h-11 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="w-24 h-4 rounded" />
                <Skeleton className="w-16 h-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 2. BOOKINGS SKELETON
 */
export function BookingsSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Top Filter Buttons & Search Shimmer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[20, 24, 24, 28].map((w, idx) => (
            <Skeleton key={idx} className={`h-10 rounded-xl w-${w}`} style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
      </div>

      {/* Main Bookings Table Container */}
      <div
        className="rounded-2xl border overflow-hidden shadow-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {["Order & Status", "Customer / Contact", "Material Details", "Delivery Destination", "Pricing & Driver", "Actions"].map((col, idx) => (
                  <th key={idx} className="py-4 px-5">
                    <Skeleton className="w-24 h-3.5 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <tr key={row} className="py-4">
                  {/* Order & Status */}
                  <td className="py-4 px-5 space-y-2">
                    <Skeleton className="w-20 h-5 rounded-md" />
                    <Skeleton className="w-16 h-4 rounded-full" />
                    <Skeleton className="w-24 h-3 rounded" />
                  </td>

                  {/* Customer / Contact */}
                  <td className="py-4 px-5 space-y-2">
                    <Skeleton className="w-28 h-4 rounded" />
                    <Skeleton className="w-24 h-3.5 rounded" />
                    <Skeleton className="w-32 h-3 rounded" />
                  </td>

                  {/* Material Details */}
                  <td className="py-4 px-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="w-24 h-4 rounded" />
                        <Skeleton className="w-16 h-3 rounded" />
                      </div>
                    </div>
                  </td>

                  {/* Delivery Destination */}
                  <td className="py-4 px-5 space-y-2 max-w-[200px]">
                    <Skeleton className="w-36 h-3.5 rounded" />
                    <Skeleton className="w-24 h-3 rounded" />
                  </td>

                  {/* Pricing & Driver */}
                  <td className="py-4 px-5 space-y-2">
                    <Skeleton className="w-20 h-5 rounded" />
                    <Skeleton className="w-24 h-3.5 rounded-full" />
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-20 h-8 rounded-lg" />
                      <Skeleton className="w-16 h-8 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="block lg:hidden divide-y" style={{ borderColor: "var(--border)" }}>
          {[1, 2, 3, 4].map((m) => (
            <div key={m} className="p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <Skeleton className="w-24 h-5 rounded-md" />
                <Skeleton className="w-20 h-5 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="w-40 h-4 rounded" />
                <Skeleton className="w-32 h-3.5 rounded" />
                <Skeleton className="w-48 h-3.5 rounded" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <Skeleton className="w-24 h-6 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="w-16 h-8 rounded-lg" />
                  <Skeleton className="w-16 h-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 3. BOOKING HISTORY SKELETON
 */
export function HistorySkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <Skeleton className="h-6 w-36 rounded-md" />
        <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
      </div>

      {/* Main Table Container */}
      <div
        className="rounded-2xl border overflow-hidden shadow-xs"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b text-xs font-bold uppercase tracking-wider"
                style={{ borderColor: "var(--border)" }}
              >
                {["Status", "Booking ID", "Material Title", "Customer Name", "Quantity", "Total Amount", "Action"].map((col, idx) => (
                  <th key={idx} className="py-4 px-5">
                    <Skeleton className="w-20 h-3.5 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: "var(--border)" }}>
              {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                <tr key={row}>
                  {/* Status */}
                  <td className="py-4 px-5">
                    <Skeleton className="w-20 h-5 rounded-full" />
                  </td>

                  {/* Booking ID */}
                  <td className="py-4 px-5">
                    <Skeleton className="w-24 h-4 rounded-md" />
                  </td>

                  {/* Material Title */}
                  <td className="py-4 px-5 space-y-1">
                    <Skeleton className="w-32 h-4 rounded" />
                    <Skeleton className="w-16 h-3 rounded" />
                  </td>

                  {/* Customer Name */}
                  <td className="py-4 px-5">
                    <Skeleton className="w-28 h-4 rounded" />
                  </td>

                  {/* Quantity */}
                  <td className="py-4 px-5">
                    <Skeleton className="w-16 h-4 rounded" />
                  </td>

                  {/* Total Amount */}
                  <td className="py-4 px-5">
                    <Skeleton className="w-20 h-4 rounded" />
                  </td>

                  {/* Action */}
                  <td className="py-4 px-6 text-right">
                    <Skeleton className="w-16 h-7 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y" style={{ borderColor: "var(--border)" }}>
          {[1, 2, 3, 4, 5].map((c) => (
            <div key={c} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="w-20 h-5 rounded-full" />
                <Skeleton className="w-24 h-4 rounded" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="w-36 h-4 rounded" />
                <Skeleton className="w-28 h-3.5 rounded" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <Skeleton className="w-20 h-4 rounded" />
                <Skeleton className="w-16 h-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 4. MESSAGES & CANCELLATION REQUESTS SKELETON
 */
export function MessagesSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="p-4 rounded-2xl border glass flex flex-col justify-between space-y-3.5"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="w-24 h-4 rounded" />
              <Skeleton className="w-32 h-5 rounded-md" />
            </div>
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <div className="space-y-2 py-1">
            <Skeleton className="w-40 h-4 rounded" />
            <Skeleton className="w-full h-3 rounded" />
            <Skeleton className="w-4/5 h-3 rounded" />
          </div>
          <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <Skeleton className="w-20 h-4 rounded" />
            <Skeleton className="w-16 h-7 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 5. DRIVERS FLEET SKELETON
 */
export function DriversSkeleton() {
  return (
    <div className="p-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-2xl border p-4 space-y-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="w-28 h-4 rounded" />
                <Skeleton className="w-20 h-3 rounded" />
              </div>
            </div>
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <div className="space-y-2 pt-1">
            <Skeleton className="w-36 h-3.5 rounded" />
            <Skeleton className="w-28 h-3.5 rounded" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="flex-1 h-8 rounded-xl" />
            <Skeleton className="flex-1 h-8 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 6. ADD GOODS / CURRENT STOCK SKELETON
 */
export function AddGoodsSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Image", "Material", "Details", "Price", "Quantity", "Assigned Driver", "Status", "Actions"].map((h, idx) => (
                <th key={idx} className="px-5 py-3 text-left">
                  <Skeleton className="w-16 h-3 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row} className="py-3">
                <td className="px-5 py-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                </td>
                <td className="px-5 py-3 space-y-1">
                  <Skeleton className="w-24 h-4 rounded" />
                  <Skeleton className="w-16 h-3 rounded" />
                </td>
                <td className="px-5 py-3">
                  <Skeleton className="w-20 h-4 rounded" />
                </td>
                <td className="px-5 py-3">
                  <Skeleton className="w-16 h-4 rounded" />
                </td>
                <td className="px-5 py-3">
                  <Skeleton className="w-20 h-4 rounded" />
                </td>
                <td className="px-5 py-3">
                  <Skeleton className="w-24 h-4 rounded" />
                </td>
                <td className="px-5 py-3">
                  <Skeleton className="w-16 h-5 rounded-full" />
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <Skeleton className="w-12 h-7 rounded-lg" />
                    <Skeleton className="w-12 h-7 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Skeleton */}
      <div className="block sm:hidden divide-y" style={{ borderColor: "var(--border)" }}>
        {[1, 2, 3, 4].map((m) => (
          <div key={m} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="w-28 h-4 rounded" />
                  <Skeleton className="w-16 h-3 rounded" />
                </div>
              </div>
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
            <div className="space-y-1 pt-1">
              <Skeleton className="w-32 h-3.5 rounded" />
              <Skeleton className="w-24 h-3.5 rounded" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="flex-1 h-8 rounded-xl" />
              <Skeleton className="flex-1 h-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 7. USER NOTIFICATIONS SKELETON
 */
export function NotificationsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <article
          key={i}
          className="glass p-5 rounded-2xl border space-y-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Skeleton className="w-20 h-5 rounded-full" />
                <Skeleton className="w-24 h-4 rounded-md" />
              </div>
              <Skeleton className="w-48 h-5 rounded-md" />
              <Skeleton className="w-full max-w-md h-3.5 rounded" />
            </div>
            <Skeleton className="w-16 h-3.5 rounded shrink-0" />
          </div>
          <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <Skeleton className="w-28 h-4 rounded" />
            <Skeleton className="w-20 h-4 rounded" />
          </div>
        </article>
      ))}
    </div>
  );
}

/**
 * 8. AVAILABLE GOODS / STOCKS SKELETON
 */
export function AvailableGoodsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="rounded-2xl border overflow-hidden flex flex-col justify-between"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <Skeleton className="w-full h-44 rounded-none" />
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="w-20 h-4 rounded" />
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
              <Skeleton className="w-36 h-5 rounded-md" />
              <Skeleton className="w-28 h-3.5 rounded" />
            </div>
            <div className="pt-3 border-t space-y-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <Skeleton className="w-20 h-5 rounded" />
                <Skeleton className="w-24 h-4 rounded" />
              </div>
              <Skeleton className="w-full h-10 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

