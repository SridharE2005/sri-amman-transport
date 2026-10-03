// src/components/FloatingContactButtons.jsx
import { useLocation } from "react-router-dom";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";

export default function FloatingContactButtons() {
  const { pathname } = useLocation();

  // Hide on admin routes to prevent overlapping admin dashboard controls
  if (pathname.startsWith("/admin")) return null;

  const phoneNumber = "+919787216797";
  const displayPhone = "+91 9787216797";
  const whatsappUrl = `https://wa.me/919787216797?text=${encodeURIComponent(
    "Hello Sri Amman Transport, I would like to inquire about goods booking & transport services."
  )}`;

  return (
    <div
      className="fixed bottom-3.5 right-3.5 sm:bottom-6 sm:right-6 z-40 flex flex-col gap-2 sm:gap-3 items-end select-none pointer-events-auto"
      aria-label="Quick contact"
    >
      {/* WhatsApp Button */}
      <div className="relative group flex items-center">
        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-xl bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 group-hover:-translate-x-1 border border-white/10 hidden sm:block">
          Chat on WhatsApp
        </span>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="relative flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#25D366] text-white shadow-md sm:shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <FaWhatsapp className="text-lg sm:text-2xl" />
        </a>
      </div>

      {/* Calling Button with Wave & Ringing Effect */}
      <div className="relative group flex items-center">
        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-xl bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 group-hover:-translate-x-1 border border-white/10 hidden sm:block">
          Call Now: {displayPhone}
        </span>

        {/* Pulsating wave rings (active on larger screens to avoid obscuring mobile content) */}
        <div className="hidden sm:block absolute inset-0 rounded-full bg-blue-500/40 animate-call-wave-1 pointer-events-none" />
        <div className="hidden sm:block absolute inset-0 rounded-full bg-cyan-400/35 animate-call-wave-2 pointer-events-none" />

        <a
          href={`tel:${phoneNumber}`}
          aria-label={`Call Sri Amman Transport at ${displayPhone}`}
          className="relative flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-500 text-white shadow-md sm:shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/60 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
        >
          {/* Ringing phone icon */}
          <div className="animate-phone-ring flex items-center justify-center">
            <FaPhoneAlt className="text-xs sm:text-lg" />
          </div>
        </a>
      </div>
    </div>
  );
}
