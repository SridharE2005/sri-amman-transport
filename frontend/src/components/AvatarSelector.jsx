// src/components/AvatarSelector.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { FiChevronLeft, FiChevronRight, FiCamera, FiX, FiCheck } from "react-icons/fi";
import { DEFAULT_AVATARS } from "../utils/defaultAvatars";
import API from "../services/api";

export default function AvatarSelector({
  selectedUrl,
  customFile,
  onSelectAvatar,
  isUploading = false,
}) {
  const [avatars, setAvatars] = useState(DEFAULT_AVATARS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customPreview, setCustomPreview] = useState(customFile ? URL.createObjectURL(customFile) : null);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const fileInputRef = useRef(null);
  const isInitialMount = useRef(true);
  const scrollRaf = useRef(null);

  // Sync with backend default avatars if available
  useEffect(() => {
    API.get("/auth/default-avatars")
      .then(({ data }) => {
        if (Array.isArray(data) && data.length) {
          setAvatars(data);
        }
      })
      .catch(() => {});
  }, []);

  // Sync customPreview with customFile
  useEffect(() => {
    if (customFile) {
      const preview = URL.createObjectURL(customFile);
      setCustomPreview(preview);
      return () => URL.revokeObjectURL(preview);
    } else {
      setCustomPreview(null);
    }
  }, [customFile]);

  // Initial selection and scroll into center
  useEffect(() => {
    let targetIdx = 0;
    if (selectedUrl && !customFile) {
      const foundIdx = avatars.findIndex((a) => a.url === selectedUrl);
      if (foundIdx !== -1) targetIdx = foundIdx;
    }
    setSelectedIndex(targetIdx);

    const timer = setTimeout(() => {
      const targetEl = itemRefs.current[targetIdx];
      if (targetEl && containerRef.current) {
        targetEl.scrollIntoView({
          behavior: isInitialMount.current ? "auto" : "smooth",
          inline: "center",
          block: "nearest",
        });
        isInitialMount.current = false;
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [avatars, selectedUrl, customFile]);

  // Smooth scroll listener: detects center avatar using requestAnimationFrame (60fps/120fps)
  const handleScroll = useCallback(() => {
    if (scrollRaf.current) return;

    scrollRaf.current = requestAnimationFrame(() => {
      scrollRaf.current = null;
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerCenter = container.scrollLeft + container.offsetWidth / 2;

      let closestIdx = 0;
      let minDistance = Infinity;

      itemRefs.current.forEach((el, idx) => {
        if (!el) return;
        const itemCenter = el.offsetLeft + el.offsetWidth / 2;
        const distance = Math.abs(containerCenter - itemCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }
      });

      setSelectedIndex((prev) => {
        if (prev !== closestIdx) {
          if (!customFile) {
            onSelectAvatar(avatars[closestIdx]?.url || DEFAULT_AVATARS[closestIdx]?.url, null);
          }
          return closestIdx;
        }
        return prev;
      });
    });
  }, [avatars, customFile, onSelectAvatar]);

  const scrollToAvatar = (index) => {
    if (customFile) {
      setCustomPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    const safeIndex = (index + avatars.length) % avatars.length;
    setSelectedIndex(safeIndex);
    const targetEl = itemRefs.current[safeIndex];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    onSelectAvatar(avatars[safeIndex]?.url || DEFAULT_AVATARS[safeIndex]?.url, null);
  };

  const handlePrev = () => {
    scrollToAvatar(selectedIndex > 0 ? selectedIndex - 1 : avatars.length - 1);
  };

  const handleNext = () => {
    scrollToAvatar(selectedIndex < avatars.length - 1 ? selectedIndex + 1 : 0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCustomPreview(previewUrl);
    onSelectAvatar(previewUrl, file);
    e.target.value = "";
  };

  const handleRemoveCustom = () => {
    setCustomPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    const fallbackUrl = avatars[selectedIndex]?.url || DEFAULT_AVATARS[0].url;
    onSelectAvatar(fallbackUrl, null);
    scrollToAvatar(selectedIndex);
  };

  const isCustomActive = Boolean(customFile && customPreview);

  return (
    <div className="w-full mb-6 select-none">
      <style>{`
        .avatar-scroll-container::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>

      {/* Main Glass Card (Fixed vertical layout prevents any jumping) */}
      <div
        className="p-4 sm:p-5 rounded-3xl border relative overflow-hidden"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Header indicator */}
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px]" style={{ color: "var(--text3)" }}>
            Profile Avatar
          </span>
          <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <FiCheck className="text-xs" />
            {isCustomActive ? "Custom Photo Selected" : "Smooth Swipe to Select"}
          </span>
        </div>

        {/* Fixed Height Viewport (h-36 sm:h-40) guarantees ZERO size change */}
        <div className="relative flex items-center justify-center h-36 sm:h-40 w-full overflow-hidden">
          {isCustomActive ? (
            /* Custom Image Display */
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-500/25">
                <img src={customPreview} alt="Custom avatar" className="w-full h-full object-cover" />
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-lg ring-2 ring-white/40">
                  <FiCheck strokeWidth={3} />
                </div>
              </div>
              <p className="text-xs font-semibold text-emerald-400 mt-2 truncate max-w-[200px]">
                {customFile?.name || "Custom Image"}
              </p>
            </div>
          ) : (
            /* Smooth Scrollable 3-Avatar Carousel Container */
            <div className="relative flex items-center justify-center w-full h-full">
              {/* Left Chevron Button (Hidden on Mobile) */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous avatar"
                className="hidden sm:flex absolute left-1 z-30 w-9 h-9 rounded-full items-center justify-center border shadow-lg transition-all duration-200 hover:scale-110 hover:bg-white/10 cursor-pointer shrink-0"
                style={{ background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <FiChevronLeft className="text-lg" />
              </button>

              {/* Native Scroll Track with Fixed-Size Slots */}
              <div
                ref={containerRef}
                onScroll={handleScroll}
                className="avatar-scroll-container flex items-center overflow-x-auto scroll-smooth snap-x snap-mandatory h-full w-full"
                style={{
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  paddingLeft: "calc(50% - 44px)",
                  paddingRight: "calc(50% - 44px)",
                }}
              >
                {avatars.map((avatar, idx) => {
                  const isCenter = idx === selectedIndex;
                  return (
                    /* Constant slot width (w-24 sm:w-28) prevents container from shrinking or expanding! */
                    <div
                      key={avatar.id || idx}
                      ref={(el) => (itemRefs.current[idx] = el)}
                      onClick={() => scrollToAvatar(idx)}
                      className="w-22 sm:w-28 h-full flex items-center justify-center shrink-0 snap-center cursor-pointer"
                    >
                      {/* Avatar Circle with GPU-accelerated Transform Scale (Zero layout reflow) */}
                      <div
                        className={`relative rounded-full overflow-hidden transition-all duration-300 ease-out select-none will-change-transform ${
                          isCenter
                            ? "w-20 h-20 sm:w-24 sm:h-24 scale-110 sm:scale-120 border-4 border-emerald-500 shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-500/25 z-20 opacity-100"
                            : "w-20 h-20 sm:w-24 sm:h-24 scale-75 border-2 border-white/20 opacity-40 hover:opacity-75 z-10"
                        }`}
                        style={{ background: "var(--bg2)" }}
                      >
                        <img
                          src={avatar.url}
                          alt=""
                          className="w-full h-full object-contain p-1 select-none pointer-events-none"
                          loading="lazy"
                        />

                        {/* Green Checkmark Badge on Center Avatar */}
                        {isCenter && (
                          <div className="absolute bottom-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-lg ring-2 ring-white/40">
                            <FiCheck strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Chevron Button (Hidden on Mobile) */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next avatar"
                className="hidden sm:flex absolute right-1 z-30 w-9 h-9 rounded-full items-center justify-center border shadow-lg transition-all duration-200 hover:scale-110 hover:bg-white/10 cursor-pointer shrink-0"
                style={{ background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <FiChevronRight className="text-lg" />
              </button>
            </div>
          )}
        </div>

        {/* Custom Image Upload Option */}
        <div className="mt-2 pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: "var(--border)" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />

          {isCustomActive ? (
            <div className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-xs font-semibold text-emerald-400 truncate pl-1">
                Custom Photo Active
              </span>
              <button
                type="button"
                onClick={handleRemoveCustom}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition cursor-pointer"
              >
                <FiX className="text-sm" />
                <span>Remove Custom Photo</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed transition-all duration-200 hover:bg-white/5 cursor-pointer text-xs font-semibold group"
              style={{ borderColor: "var(--border)", color: "var(--text2)" }}
            >
              <FiCamera className="text-base text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Upload Your Own Image</span>
            </button>
          )}
        </div>

        {isUploading && (
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-emerald-400">
            <span className="animate-spin text-sm">⏳</span>
            <span>Uploading image to Cloudinary...</span>
          </div>
        )}
      </div>
    </div>
  );
}
