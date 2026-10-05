// src/services/socket.js
import { io } from "socket.io-client";

const rawBaseURL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

const SOCKET_SERVER_URL = rawBaseURL.trim().replace(/\/api\/?$/, "").replace(/\/$/, "");

let socket = null;

export const getSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    return null;
  }

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_SERVER_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("[Socket.IO] Connected successfully with ID:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket.IO] Connection error:", err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
