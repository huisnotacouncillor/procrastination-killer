import { useState, useEffect, memo } from "react";

interface MinimalDisplayProps {
  minutes: number;
  seconds: number;
  fontSize?: number;
  textColor?: string;
  fontWeight?: React.CSSProperties["fontWeight"];
}

function MinimalDisplay({
  minutes,
  seconds,
  fontSize = 200,
  textColor,
  fontWeight = 300,
}: MinimalDisplayProps) {
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

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 使用更柔和的配色
  const txtColor = textColor || (isDark ? "#cbd5e1" : "#475569");

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className="font-light tracking-widest font-mono"
        style={{
          color: txtColor,
          fontSize: `${fontSize}px`,
          fontWeight,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.1em",
        }}
      >
        {formatTime(minutes, seconds)}
      </div>
    </div>
  );
}

// 使用memo优化，只在props变化时重新渲染
export default memo(MinimalDisplay);
