import { useState, useEffect, memo } from "react";

interface ProgressDisplayProps {
  minutes: number;
  seconds: number;
  totalMinutes: number;
  width?: number;
  height?: number;
  textColor?: string;
  progressColor?: string;
  backgroundColor?: string;
}

function ProgressDisplay({
  minutes,
  seconds,
  totalMinutes,
  width = 600,
  height = 20,
  textColor,
  progressColor,
  backgroundColor,
}: ProgressDisplayProps) {
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
    <div className="flex flex-col items-center space-y-6">
      {/* Time display */}
      <div className="text-7xl font-bold" style={{ color: txtColor }}>
        {formatTime(minutes, seconds)}
      </div>

      {/* Progress bar */}
      <div
        className="relative rounded-full overflow-hidden transition-colors"
        style={{ width, height }}
      >
        {/* Background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: bgColor }}
        />

        {/* Progress */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-1000 ease-out"
          style={{
            backgroundColor: progColor,
            width: `${progress}%`,
            height: "100%",
          }}
        />

        {/* Progress text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold" style={{ color: txtColor }}>
            {Math.floor(progress)}%
          </span>
        </div>
      </div>

      {/* Time remaining */}
      <div className="text-lg opacity-70" style={{ color: txtColor }}>
        {Math.floor(remainingSeconds / 60)} minutes {remainingSeconds % 60}{" "}
        seconds remaining
      </div>
    </div>
  );
}

// 使用memo优化，只在props变化时重新渲染
export default memo(ProgressDisplay);
