import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { UserProvider }  from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LoadingProvider } from "./context/LoadingProvider";
import GlobalLoading from "./components/GlobalLoading";
import FloatingContactButtons from "./components/FloatingContactButtons";

import Home        from "./pages/Home";
import UserLogin   from "./pages/UserLogin";
import Register    from "./pages/Register";
import VerifyOtp   from "./pages/VerifyOtp";
import Stocks      from "./pages/Stocks";
import BookingHistory from "./pages/BookingHistory";
import Notifications  from "./pages/Notifications";
import Profile        from "./pages/Profile";
import Bricks         from "./pages/Bricks";
import NotFound       from "./pages/NotFound";

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard   from "./pages/admin/Dashboard";
import AddGoods    from "./pages/admin/AddGoods";
import Bookings    from "./pages/admin/Bookings";
import BookingHistoryAdmin from "./pages/admin/BookingHistory";
import Ratings           from "./pages/admin/Ratings";
import Messages    from "./pages/admin/Messages";
import Drivers     from "./pages/admin/Drivers";
import DriverDetails from "./pages/admin/DriverDetails";
import DriverLiveTracking from "./pages/admin/DriverLiveTracking";

import DriverAppNotice from "./pages/driver/DriverAppNotice";

import useScrollReveal from "./hooks/useScrollReveal";

function ScrollRevealWatcher() {
  useScrollReveal();
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ScrollRevealWatcher />
      <ThemeProvider>
        <LoadingProvider>
          <UserProvider>
            <GlobalLoading />
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
            <FloatingContactButtons />
            <Routes>
            {/* Public routes */}
            <Route path="/"            element={<Home />} />
            <Route path="/login"       element={<UserLogin />} />
            <Route path="/user-login"  element={<Navigate to="/login" replace />} />
            <Route path="/admin-login" element={<Navigate to="/login" replace />} />
            <Route path="/register"    element={<Register />} />
            <Route path="/verify"      element={<VerifyOtp />} />
            <Route path="/stocks"      element={<Stocks />} />
            <Route path="/booking-history" element={<BookingHistory />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile"      element={<Profile />} />
            <Route path="/bricks"       element={<Bricks />} />
            <Route path="/variety-of-bricks" element={<Bricks />} />

            {/* Admin routes — nested under AdminLayout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index          element={<Dashboard />} />
              <Route path="goods"   element={<AddGoods />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="history" element={<BookingHistoryAdmin />} />
              <Route path="ratings" element={<Ratings />} />
              <Route path="messages" element={<Messages />} />
              <Route path="drivers"  element={<Drivers />} />
              <Route path="drivers/:driverId" element={<DriverDetails />} />
              <Route path="drivers/:driverId/live-tracking" element={<DriverLiveTracking />} />
            </Route>

            {/* Driver routes — redirected to mobile app notice */}
            <Route path="/driver/*" element={<DriverAppNotice />} />

            <Route path="*" element={<NotFound />} />
            </Routes>
          </UserProvider>
        </LoadingProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
