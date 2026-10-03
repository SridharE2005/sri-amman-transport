import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BRICK_VARIETIES } from "../data/brickVarieties";
import { useTheme } from "../context/ThemeContext";
import { FaArrowLeft, FaArrowRight, FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function BrickCarousel() {
  const navigate = useNavigate();
  const { tr } = useTheme();

  const N = BRICK_VARIETIES.length;
  // Triple buffer so there is always a buffer of items before and after
  const extendedItems = [...BRICK_VARIETIES, ...BRICK_VARIETIES, ...BRICK_VARIETIES];

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  const [currentIndex, setCurrentIndex] = useState(N);
  const trackRef = useRef(null);
  const timerRef = useRef(null);
  const isHoveredRef = useRef(false);

  // Touch tracking: horizontal on desktop, vertical on mobile
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // Preload all brick images eagerly on mount so they are cached in GPU memory and never blink
  useEffect(() => {
    BRICK_VARIETIES.forEach((brick) => {
      const img = new Image();
      img.src = brick.img;
    });
  }, []);

  // Responsive breakpoint handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Desktop horizontal layout constants: 4 cards visible (25% each)
  const desktopSlotWidthPercent = 25;

  // Mobile vertical layout constants: scrolls from bottom to top
  const mobileCardHeight = 210;
  const mobileContainerHeight = 350;
  const mobileCenterOffset = (mobileContainerHeight - mobileCardHeight) / 2; // 70px

  // Next slide with smooth transition
  const handleNext = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transition = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
    }
    setCurrentIndex((prev) => prev + 1);
  }, []);

  // Previous slide with smooth transition
  const handlePrev = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transition = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
    }
    setCurrentIndex((prev) => prev - 1);
  }, []);

  // 3-second automatic sliding timer
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!isHoveredRef.current) {
        handleNext();
      }
    }, 3000);
  }, [handleNext]);

  const resetTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  // Manual button clicks: advance slide and reset 3s countdown
  const handleManualNext = () => {
    resetTimer();
    handleNext();
  };

  const handleManualPrev = () => {
    resetTimer();
    handlePrev();
  };

  // Seamless invisible wrap when transition completes (supports both horizontal desktop and vertical mobile)
  const handleTransitionEnd = () => {
    if (!trackRef.current) return;

    if (currentIndex >= N * 2) {
      const newIndex = currentIndex - N;
      trackRef.current.style.transition = "none";
      if (isMobile) {
        trackRef.current.style.transform = `translateY(${mobileCenterOffset - newIndex * mobileCardHeight}px)`;
      } else {
        trackRef.current.style.transform = `translateX(-${newIndex * desktopSlotWidthPercent}%)`;
      }
      void trackRef.current.offsetHeight; // Force browser layout reflow synchronously
      setCurrentIndex(newIndex);
    } else if (currentIndex < N) {
      const newIndex = currentIndex + N;
      trackRef.current.style.transition = "none";
      if (isMobile) {
        trackRef.current.style.transform = `translateY(${mobileCenterOffset - newIndex * mobileCardHeight}px)`;
      } else {
        trackRef.current.style.transform = `translateX(-${newIndex * desktopSlotWidthPercent}%)`;
      }
      void trackRef.current.offsetHeight; // Force browser layout reflow synchronously
      setCurrentIndex(newIndex);
    }
  };

  // Touch gesture handlers
  const handleTouchStart = (e) => {
    if (isMobile) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e) => {
    if (isMobile) {
      touchEndY.current = e.touches[0].clientY;
    } else {
      touchEndX.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    if (isMobile) {
      if (!touchStartY.current || !touchEndY.current) return;
      const diffY = touchStartY.current - touchEndY.current;
      // Swiping UP moves to NEXT (bottom to top), swiping DOWN moves to PREVIOUS
      if (diffY > 35) {
        handleManualNext();
      } else if (diffY < -35) {
        handleManualPrev();
      }
      touchStartY.current = 0;
      touchEndY.current = 0;
    } else {
      if (!touchStartX.current || !touchEndX.current) return;
      const diffX = touchStartX.current - touchEndX.current;
      if (diffX > 40) {
        handleManualNext();
      } else if (diffX < -40) {
        handleManualPrev();
      }
      touchStartX.current = 0;
      touchEndX.current = 0;
    }
  };

  // Navigate to /variety-of-bricks with the selected brick
  const handleCardClick = (brick) => {
    navigate("/variety-of-bricks", { state: { selectedBrickId: brick.id } });
  };

  const activeIndex = ((currentIndex % N) + N) % N;

  return (
    <div
      className="relative w-full max-w-6xl mx-auto select-none"
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        resetTimer();
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Controls:
          On Desktop: shows full badge & link.
          On Mobile: 20 varieties text is removed, clean header with direct link */}
      <div className="flex items-center justify-between mb-4 px-3 sm:px-6">
        <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
          {tr("Variety of Bricks")} • {N} {tr("Varieties Available")}
        </span>

        <button
          onClick={() => navigate("/variety-of-bricks")}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-500 hover:text-blue-400 transition cursor-pointer ml-auto"
        >
          <span>{tr("View All Varieties")}</span>
          <FaArrowRight className="text-xs" />
        </button>
      </div>

      {/* ══ MOBILE VIEW: VERTICAL CAROUSEL (SCROLLS FROM BOTTOM TO TOP) ══ */}
      {isMobile ? (
        <div className="relative w-full overflow-hidden flex items-center justify-center py-2">
          {/* Mobile Up Navigation Button (Previous) */}
          <button
            onClick={handleManualPrev}
            aria-label="Previous brick"
            title={tr("Previous")}
            className="absolute top-2 right-4 z-30 w-9 h-9 rounded-full glass border border-white/20 hover:border-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-lg flex items-center justify-center active:scale-90 cursor-pointer"
            style={{ color: "var(--text)" }}
          >
            <FaArrowUp className="text-xs" />
          </button>

          {/* Mobile Down Navigation Button (Next - moves bottom to top) */}
          <button
            onClick={handleManualNext}
            aria-label="Next brick"
            title={tr("Next")}
            className="absolute bottom-2 right-4 z-30 w-9 h-9 rounded-full glass border border-white/20 hover:border-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-lg flex items-center justify-center active:scale-90 cursor-pointer"
            style={{ color: "var(--text)" }}
          >
            <FaArrowDown className="text-xs" />
          </button>

          {/* Vertical Viewport Mask */}
          <div
            className="overflow-hidden w-full max-w-[320px] rounded-2xl relative"
            style={{ height: `${mobileContainerHeight}px` }}
          >
            {/* Top and Bottom subtle gradient fade to blend the vertical edges smoothly */}
            <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-[var(--bg)] to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none z-20" />

            {/* Vertical Sliding Track (Moves upwards from bottom to top) */}
            <div
              ref={trackRef}
              className="flex flex-col items-center w-full"
              style={{
                transform: `translateY(${mobileCenterOffset - currentIndex * mobileCardHeight}px)`,
                transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {extendedItems.map((brick, idx) => {
                const isCenterLarge = idx === currentIndex;

                return (
                  <div
                    key={`${brick.id}-${idx}`}
                    className="w-full flex-shrink-0 flex items-center justify-center p-1"
                    style={{
                      height: `${mobileCardHeight}px`,
                    }}
                  >
                    {/* Clean Full Card for Mobile:
                        Full centered image, name of brick, and view button */}
                    <div
                      onClick={() => handleCardClick(brick)}
                      style={{
                        transform: isCenterLarge ? "scale(1)" : "scale(0.85)",
                        opacity: isCenterLarge ? 1 : 0.45,
                        filter: isCenterLarge ? "none" : "brightness(0.85)",
                        transition:
                          "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease, filter 600ms ease, border-color 300ms ease, box-shadow 300ms ease",
                        borderColor: isCenterLarge ? "rgba(59, 130, 246, 0.55)" : "var(--border)",
                        background: "var(--surface)",
                      }}
                      className={`glass rounded-2xl overflow-hidden cursor-pointer group flex flex-col w-[92%] h-[195px] border ${
                        isCenterLarge
                          ? "shadow-xl shadow-blue-500/15 z-20"
                          : "z-10"
                      }`}
                    >
                      {/* Top: Full Centered Brick Image */}
                      <div className="relative w-full h-[110px] overflow-hidden bg-slate-900/40 flex items-center justify-center p-1.5">
                        <img
                          src={brick.img}
                          alt={brick.name}
                          decoding="sync"
                          className="w-full h-full object-cover object-center rounded-xl group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Name of the bricks & View button */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <h3
                          className="font-bold text-sm tracking-tight text-white group-hover:text-blue-500 transition-colors truncate text-center"
                          title={brick.name}
                        >
                          {brick.name}
                        </h3>

                        {/* View Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(brick);
                          }}
                          className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1 shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer"
                        >
                          <span>{tr("View Details")}</span>
                          <FaArrowRight className="text-[10px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ══ DESKTOP / LAPTOP VIEW: HORIZONTAL CAROUSEL (4 FULL CARDS: [SMALL] [LARGE] [LARGE] [SMALL]) ══ */
        <div className="relative w-full overflow-hidden px-10 sm:px-12 md:px-14 py-2 sm:py-3">
          {/* Left (Previous) Navigation Button */}
          <button
            onClick={handleManualPrev}
            aria-label="Previous brick"
            title={tr("Previous")}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full glass border border-white/20 hover:border-blue-500 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-xl flex items-center justify-center active:scale-90 cursor-pointer"
            style={{ color: "var(--text)" }}
          >
            <FaArrowLeft className="text-sm" />
          </button>

          {/* Right (Next) Navigation Button */}
          <button
            onClick={handleManualNext}
            aria-label="Next brick"
            title={tr("Next")}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full glass border border-white/20 hover:border-blue-500 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-xl flex items-center justify-center active:scale-90 cursor-pointer"
            style={{ color: "var(--text)" }}
          >
            <FaArrowRight className="text-sm" />
          </button>

          {/* Horizontal Viewport Mask */}
          <div className="overflow-hidden w-full rounded-2xl py-2">
            {/* Sliding Flex Track */}
            <div
              ref={trackRef}
              className="flex items-center"
              style={{
                transform: `translateX(-${currentIndex * desktopSlotWidthPercent}%)`,
                transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {extendedItems.map((brick, idx) => {
                const isCenterLarge =
                  idx === currentIndex + 1 || idx === currentIndex + 2;

                return (
                  <div
                    key={`${brick.id}-${idx}`}
                    className="px-2 flex-shrink-0"
                    style={{
                      width: `${desktopSlotWidthPercent}%`,
                    }}
                  >
                    {/* Clean Desktop Card showing full image and details */}
                    <div
                      onClick={() => handleCardClick(brick)}
                      style={{
                        transform: isCenterLarge ? "scale(1)" : "scale(0.85)",
                        opacity: isCenterLarge ? 1 : 0.65,
                        filter: isCenterLarge ? "none" : "brightness(0.92)",
                        transition:
                          "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease, filter 600ms ease, border-color 300ms ease, box-shadow 300ms ease",
                        borderColor: isCenterLarge ? "rgba(59, 130, 246, 0.5)" : "var(--border)",
                        background: "var(--surface)",
                      }}
                      className={`glass rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full border ${
                        isCenterLarge
                          ? "shadow-xl shadow-blue-500/10 z-20"
                          : "z-10 hover:opacity-85"
                      }`}
                    >
                      {/* Top: Full Brick Image */}
                      <div className="relative w-full h-36 md:h-42 overflow-hidden bg-slate-900/30 flex items-center justify-center p-1">
                        <img
                          src={brick.img}
                          alt={brick.name}
                          decoding="sync"
                          className="w-full h-full object-cover object-center rounded-xl group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Name, Description, View Button */}
                      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3
                            className="font-bold text-sm sm:text-base tracking-tight group-hover:text-blue-500 transition-colors mb-1 truncate"
                            style={{ color: "var(--text)" }}
                            title={brick.name}
                          >
                            {brick.name}
                          </h3>

                          <p
                            className="text-xs line-clamp-2 leading-relaxed mb-3"
                            style={{ color: "var(--text2)" }}
                          >
                            {brick.desc}
                          </p>
                        </div>

                        {/* View Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(brick);
                          }}
                          className="w-full py-1.5 sm:py-2 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1 shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
                        >
                          <span>{tr("View Details")}</span>
                          <FaArrowRight className="text-[10px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Counter & Indicators (Hidden on Mobile, Clean & Minimal on Desktop) */}
      <div className="hidden sm:flex items-center justify-between gap-4 mt-3 px-3 sm:px-6">
        <span className="text-xs font-medium" style={{ color: "var(--text3)" }}>
          {tr("Showing Variety")}{" "}
          <span className="font-bold text-blue-500" style={{ color: "var(--text)" }}>
            {((activeIndex + 1) % N) + 1}
          </span>{" "}
          / {N}
        </span>

        {/* Minimal dot indicators */}
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {BRICK_VARIETIES.map((brick, idx) => {
            const isActive = idx === (activeIndex + 1) % N;

            return (
              <button
                key={brick.id}
                onClick={() => {
                  resetTimer();
                  if (trackRef.current) {
                    trackRef.current.style.transition = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
                  }
                  setCurrentIndex(N + idx - 1);
                }}
                aria-label={`Go to ${brick.name}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive ? "w-5 bg-blue-500" : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
