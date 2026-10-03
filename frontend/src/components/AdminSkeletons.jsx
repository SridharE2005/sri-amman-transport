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
