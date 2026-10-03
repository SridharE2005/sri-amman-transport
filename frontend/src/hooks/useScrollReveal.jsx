import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Predefined set of varied animation styles to cycle through for sections
const SECTION_DIRECTIONS = [
  "reveal-fade-up",
  "reveal-slide-left",
  "reveal-slide-right",
  "reveal-scale-up",
  "reveal-fade-up",
  "reveal-slide-right",
  "reveal-slide-left",
];

export default function useScrollReveal() {
  const location = useLocation();

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const observerOptions = {
      root: null,
      rootMargin: "0px 0px -30px 0px", // Trigger when slightly approaching viewport
      threshold: 0.08, // Start early for smooth perceived performance
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const isInInitialView = (el) => {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      return rect.top <= windowHeight * 0.9 && rect.bottom >= 0;
    };

    const applyScrollAnimations = () => {
      // 1. Process Sections - give alternating/varied subtle directions
      const sections = document.querySelectorAll("section:not(#hero)");
      sections.forEach((section, idx) => {
        const hasExisting =
          section.classList.contains("reveal") ||
          section.classList.contains("reveal-fade-up") ||
          section.classList.contains("reveal-slide-left") ||
          section.classList.contains("reveal-slide-right") ||
          section.classList.contains("reveal-scale-up") ||
          section.classList.contains("reveal-card");

        if (!hasExisting && !section.classList.contains("reveal-visible")) {
          // Assign varied animation from the list
          const animClass = SECTION_DIRECTIONS[idx % SECTION_DIRECTIONS.length];
          section.classList.add(animClass);
        }
      });

      // 2. Process Section Headings
      document.querySelectorAll(".section-title, .section-sub, .section-tag").forEach((el) => {
        if (
          !el.classList.contains("reveal-visible") &&
          !el.classList.contains("reveal-fade-up")
        ) {
          el.classList.add("reveal-fade-up");
        }
      });

      // 3. Process Cards & Glass containers inside grids/lists
      document.querySelectorAll(".grid > .glass, .grid > [class*='card']").forEach((card) => {
        if (
          !card.classList.contains("reveal-visible") &&
          !card.classList.contains("reveal-card") &&
          !card.classList.contains("reveal-scale-up") &&
          !card.classList.contains("reveal-slide-left") &&
          !card.classList.contains("reveal-slide-right") &&
          !card.classList.contains("reveal-fade-up")
        ) {
          card.classList.add("reveal-card");

          // Add subtle stagger delays based on index among siblings
          const siblings = Array.from(card.parentElement?.children || []);
          const index = siblings.indexOf(card);
          if (index > 0 && index <= 6) {
            card.classList.add(`reveal-delay-${Math.min(index, 5)}`);
          }
        }
      });

      // 4. Observe all reveal targets
      const targets = document.querySelectorAll(
        ".reveal, .reveal-fade-up, .reveal-slide-left, .reveal-slide-right, .reveal-scale-up, .reveal-card"
      );

      targets.forEach((el) => {
        if (prefersReducedMotion || isInInitialView(el)) {
          // If already in view on page load or user prefers reduced motion, reveal immediately
          el.classList.add("reveal-visible");
        } else if (!el.classList.contains("reveal-visible")) {
          observer.observe(el);
        }
      });
    };

    // Run initially and after a slight delay to allow React DOM mounting
    const timer1 = setTimeout(applyScrollAnimations, 60);
    const timer2 = setTimeout(applyScrollAnimations, 300);

    // Watch for dynamic DOM changes (e.g. data fetching completion, tabs, modals)
    let debounceTimer;
    const mutationObserver = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyScrollAnimations, 100);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(debounceTimer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);
}
