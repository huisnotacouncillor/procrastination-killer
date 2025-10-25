import { useState, useEffect, memo } from "react";

interface CircularDisplayProps {
  minutes: number;
  seconds: number;
  totalMinutes: number;
  size?: number;
  strokeWidth?: number;
  textColor?: string;
  progressColor?: string;
  backgroundColor?: string;
}

function CircularDisplay({
  minutes,
  seconds,
  totalMinutes,
  size = 300,
  strokeWidth = 8,
  textColor,
  progressColor,
  backgroundColor,
}: CircularDisplayProps) {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const totalSeconds = totalMinutes * 60;
  const remainingSeconds = minutes * 60 + seconds;
  const progress = (remainingSeconds / totalSeconds) * 100;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 使用更柔和的配色
  const bgColor = backgroundColor || (isDark ? "#1a1f2e" : "#f1f5f9");
  const progColor = progressColor || (isDark ? "#60a5fa" : "#3b82f6");
  const txtColor = textColor || (isDark ? "#e2e8f0" : "#1e293b");

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Time text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold" style={{ color: txtColor }}>
            {formatTime(minutes, seconds)}
          </div>
          <div className="text-lg opacity-60 mt-2" style={{ color: txtColor }}>
            {Math.floor(progress)}% remaining
          </div>
        </div>
      </div>
    </div>
  );
}

// 使用memo优化，只在props变化时重新渲染
export default memo(CircularDisplay);
