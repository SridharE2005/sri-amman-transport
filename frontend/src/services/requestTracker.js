const listeners = new Set();
let nextId = 1;
const activeRequests = new Map();

function getState() {
  const list = Array.from(activeRequests.values());
  const current = list.length > 0 ? list[list.length - 1] : null;
  return {
    isLoading: list.length > 0,
    activeCount: list.length,
    current,
    title: current?.title || "Working on it",
    message: current?.message || "Please wait while we complete your request.",
  };
}

function notify() {
  const state = getState();
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch {
      // ignore listener errors
    }
  });
}

export function startRequest(details = {}) {
  const id = details?.id || `req_${nextId++}_${Date.now()}`;
  const requestInfo = {
    id,
    title: details?.title || "Working on it",
    message: details?.message || "Please wait while we complete your request.",
    timestamp: Date.now(),
  };
  activeRequests.set(id, requestInfo);
  notify();
  return id;
}

export function finishRequest(id) {
  if (id && activeRequests.has(id)) {
    activeRequests.delete(id);
  } else if (activeRequests.size > 0) {
    const firstKey = activeRequests.keys().next().value;
    activeRequests.delete(firstKey);
  }
  notify();
}

export function subscribeToRequests(listener) {
  listeners.add(listener);
  listener(getState());
  return () => listeners.delete(listener);
}