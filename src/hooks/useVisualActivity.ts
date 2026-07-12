import { useEffect } from "react";

export function useVisualActivity() {
  useEffect(() => {
    const visuals = Array.from(document.querySelectorAll<HTMLElement>(".project-visual"));

    if (typeof IntersectionObserver === "undefined") {
      visuals.forEach((visual) => visual.classList.add("is-active"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-active", entry.isIntersecting);
        });
      },
      { rootMargin: "160px 0px", threshold: 0.01 },
    );

    visuals.forEach((visual) => observer.observe(visual));
    return () => observer.disconnect();
  }, []);
}
