// src/components/DriverRoute.jsx
import { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";

export default function DriverRoute() {
  const { user, loading } = useUser();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Please login to access driver dashboard");
      } else if (user.role !== "driver") {
        toast.error("Access denied. Driver privileges required.");
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-9 h-9 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "driver") {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
