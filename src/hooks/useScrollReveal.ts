import { useEffect } from "react";

const REVEAL_SELECTOR = "[data-reveal]";

export function useScrollReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));

    let revealFrame = 0;
    const revealInViewport = () => {
      revealFrame = 0;
      const viewportTop = window.innerHeight * 0.04;
      const viewportBottom = window.innerHeight * 0.94;

      elements.forEach((element) => {
        if (element.classList.contains("is-visible")) return;
        const bounds = element.getBoundingClientRect();
        if (bounds.bottom > viewportTop && bounds.top < viewportBottom) {
          element.classList.add("is-visible");
          observer.unobserve(element);
        }
      });
    };
    const scheduleViewportCheck = () => {
      if (revealFrame) return;
      revealFrame = window.requestAnimationFrame(revealInViewport);
    };

    scheduleViewportCheck();
    const restorationCheck = window.setTimeout(scheduleViewportCheck, 180);
    window.addEventListener("scroll", scheduleViewportCheck, { passive: true });
    window.addEventListener("hashchange", scheduleViewportCheck);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(revealFrame);
      window.clearTimeout(restorationCheck);
      window.removeEventListener("scroll", scheduleViewportCheck);
      window.removeEventListener("hashchange", scheduleViewportCheck);
    };
  }, []);
}
