import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

type DeferredProjectSceneProps = {
  children: ReactNode;
  className: string;
};

export function DeferredProjectScene({ children, className }: DeferredProjectSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "80px 0px", threshold: 0.01 },
    );

    observer.observe(mount);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div className={className} ref={mountRef} aria-hidden="true">
      {shouldLoad ? (
        <Suspense fallback={<div className="smart-frame-loading" aria-hidden="true" />}>
          {children}
        </Suspense>
      ) : (
        <div className="smart-frame-loading" aria-hidden="true" />
      )}
    </div>
  );
}
