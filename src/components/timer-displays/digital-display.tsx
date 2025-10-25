import { useState, useEffect, memo } from "react";

interface DigitalDisplayProps {
  minutes: number;
  seconds: number;
  fontSize?: number;
  textColor?: string;
}

function DigitalDisplay({
  minutes,
  seconds,
  fontSize = 180,
  textColor,
}: DigitalDisplayProps) {
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
  // 暗色主题使用柔和的绿青色，亮色主题使用深蓝灰色
  const txtColor = textColor || (isDark ? "#4ade80" : "#475569");
  const glowColor = isDark ? "#4ade80" : "#475569";

  return (
    <div
      className="flex items-center justify-center p-8 rounded-lg transition-colors"
      style={{
        // backgroundColor: bgColor,
        // borderColor: bordColor,
        fontFamily: "monospace",
      }}
    >
      <div
        className="font-mono font-bold tracking-wider"
        style={{
          color: txtColor,
          fontSize: `${fontSize}px`,
          textShadow: isDark
            ? `0 0 20px ${glowColor}80, 0 0 40px ${glowColor}40`
            : `0 0 0 ${glowColor}`,
        }}
      >
        {formatTime(minutes, seconds)}
      </div>
    </div>
  );
}

// 使用memo优化，只在props变化时重新渲染
export default memo(DigitalDisplay);
