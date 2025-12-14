"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import IconCart from "./icons/cart";
import IconSearch from "./icons/search";

type LoaderProps = {
  initial?: number;
  determinate?: boolean;
  duration?: number;
  className?: string;
};

export default function Loader({
  initial = 0,
  determinate = true,
  duration = 1200,
  className = "",
}: LoaderProps) {
  const [progress, setProgress] = useState<number>(initial);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!determinate) return;
    function step(ts: number) {
      if (!start.current) start.current = ts;
      const elapsed = ts - (start.current || ts);
      const pct = Math.min(100, initial + (elapsed / duration) * (100 - initial));
      setProgress(pct);
      if (pct < 100) {
        raf.current = requestAnimationFrame(step);
      } else {
        if (raf.current) cancelAnimationFrame(raf.current);
      }
    }
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [initial, determinate, duration]);

  const valueStyle: React.CSSProperties = {
    transform: `scaleX(${progress / 100})`,
  };

  return (
    <div className={`loader-root flex items-center gap-4 ${className}`} role="status" aria-live="polite" aria-label="Loading">
      <div className="w-48 h-2 bg-[color:var(--color-muted)]/30 rounded overflow-hidden relative">
        <div className="absolute left-0 top-0 h-full bg-[color:var(--color-primary)] origin-left" style={valueStyle} />
        <div
          className="absolute left-0 top-0 h-full bg-white/6 origin-left"
          style={{
            transform: `scaleX(${Math.max(0.05, progress / 100)})`,
            mixBlendMode: "screen",
            pointerEvents: "none",
            animation: "progress-pulse 1.6s ease-in-out infinite",
          }}
        />
      </div>

      <div className="flex gap-2 items-center text-xs text-muted-foreground select-none">
        <span className="font-extralight">{Math.round(progress)}%</span>
        <div className="w-px h-4 bg-[color:var(--color-border)]/40" />
        <div className="flex gap-1 items-center text-[0.85rem]">
          <IconSearch className="text-muted-foreground" />
          <span className="sr-only">Searching products</span>
        </div>
      </div>

      <div className="ml-auto hidden md:flex items-center gap-2">
        <div className="glass-card px-2 py-1 rounded-full flex items-center gap-2">
          <IconCart className="text-foreground" />
          <span className="text-sm font-light">0</span>
        </div>
      </div>
    </div>
  );
}
