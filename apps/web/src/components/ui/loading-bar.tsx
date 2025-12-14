"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function MinimalistProgressBar({
  duration = 2000,
  color = "from-violet-500 to-fuchsia-500",
  className,
}: {
  duration?: number;
  color?: string;
  className?: string;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, duration / 100);

    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="h-1 w-full bg-muted rounded-full overflow-hidden relative">
        <div
          className={cn(
            "h-full bg-gradient-to-r transition-all duration-300 ease-out rounded-full",
            color
          )}
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Loading...</span>
        <span className="font-mono">{progress}%</span>
      </div>
    </div>
  );
}

export function CircularProgress({
  size = 120,
  strokeWidth = 8,
  progress = 0,
  color = "stroke-violet-500",
  className,
}: {
  size?: number;
  strokeWidth?: number;
  progress?: number;
  color?: string;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-300", color)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-2 items-center justify-center", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full animate-pulse"
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

export function DotLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-1 items-center justify-center", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full animate-bounce"
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
