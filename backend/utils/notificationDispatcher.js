// utils/notificationDispatcher.js
/**
 * Real-time event dispatcher.
 * Integrates cleanly with Socket.IO when attached to app (e.g. app.get("io")),
 * with graceful fallback logging so it never throws or crashes.
 */
export const dispatchRealTimeEvent = (app, eventName, payload) => {
  try {
    const io = app?.get?.("io");
    if (io && typeof io.emit === "function") {
      io.emit(eventName, payload);
      return true;
    }
  } catch (err) {
    console.warn(`[Socket.IO Fallback] Could not emit ${eventName}:`, err.message);
  }
  return false;
};
