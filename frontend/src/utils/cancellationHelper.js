// src/utils/cancellationHelper.js

/**
 * Formats milliseconds into human-readable remaining time string (e.g., "18h 42m 15s" or "18h 42m").
 */
export const formatRemainingTime = (ms) => {
  if (ms <= 0) return "0m";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

/**
 * Formats milliseconds into hours-only representation (e.g. "18 hours", "1 hour", "less than 1 hour")
 */
export const formatRemainingHours = (ms) => {
  if (ms <= 0) return "0 hours";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) {
    return "less than 1 hour";
  }
  if (hours === 1) {
    return "1 hour";
  }
  return `${hours} hours`;
};

/**
 * Returns comprehensive cancellation details for a booking.
 */
export const getCancellationInfo = (booking, now = Date.now()) => {
  if (!booking) return { canCancel: false, status: "Unknown" };

  const rawStatus = booking.status || "";
  const isPending = rawStatus === "Pending" || rawStatus === "PENDING";
  const isConfirmed = rawStatus === "Confirmed" || rawStatus === "CONFIRMED";
  const isCancelledByUser =
    rawStatus === "CANCELLED_BY_USER" || rawStatus === "Cancelled by User";
  const isCancelledByAdmin =
    rawStatus === "CANCELLED_BY_ADMIN" || rawStatus === "Cancelled by Admin";

  if (isCancelledByUser || isCancelledByAdmin) {
    const cancelledDate = booking.cancelledAt
      ? new Date(booking.cancelledAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "—";

    return {
      canCancel: false,
      isCancelled: true,
      cancelledBy: isCancelledByUser ? "USER" : "ADMIN",
      cancelledAtFormatted: cancelledDate,
      reason: booking.cancellationReason || "No reason provided",
    };
  }

  if (isPending || isConfirmed) {
    const bookingTime = booking.createdAt
      ? new Date(booking.createdAt).getTime()
      : now;
    const deadlineDate = booking.cancellationDeadline
      ? new Date(booking.cancellationDeadline)
      : new Date(bookingTime + 24 * 60 * 60 * 1000);

    const remainingMs = deadlineDate.getTime() - now;
    const isExpired = remainingMs <= 0;

    const formattedDeadline = deadlineDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const hoursOnly = formatRemainingHours(remainingMs);
    const hoursCount = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));

    return {
      canCancel: !isExpired,
      stage: isPending ? "PENDING" : "CONFIRMED",
      deadlineDate,
      deadlineFormatted: formattedDeadline,
      remainingMs: Math.max(0, remainingMs),
      remainingHours: hoursCount,
      remainingHoursFormatted: hoursOnly,
      remainingFormatted: hoursOnly,
      isExpired,
      canRequestExceptional: isExpired,
    };
  }

  return {
    canCancel: false,
    stage: rawStatus,
    isExpired: true,
    canRequestExceptional: false,
  };
};
