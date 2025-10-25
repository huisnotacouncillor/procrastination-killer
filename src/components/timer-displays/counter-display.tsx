import { useState, useEffect, memo } from "react";
import Counter from "@/components/motions/counter";

interface CounterDisplayProps {
  minutes: number;
  seconds: number;
  fontSize?: number;
  textColor?: string;
  fontWeight?: React.CSSProperties["fontWeight"];
}

function CounterDisplay({
  minutes,
  seconds,
  fontSize = 160,
  textColor,
  fontWeight = 900,
}: CounterDisplayProps) {
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

  // 使用更柔和的配色
  const displayColor = textColor || (isDark ? "#e2e8f0" : "#1e293b");

  return (
    <div className="flex items-center gap-2">
      {/* 分 */}
      <div className="p-4">
        <Counter
          value={minutes}
          places={[10, 1]}
          fontSize={fontSize}
          padding={5}
          gap={10}
          textColor={displayColor}
          fontWeight={fontWeight}
        />
      </div>
      <span
        className="text-6xl -mt-8 font-bold"
        style={{ color: displayColor, fontSize: `${fontSize * 0.6}px` }}
      >
        :
      </span>
      {/* 秒 */}
      <div className="p-4">
        <Counter
          value={seconds}
          places={[10, 1]}
          fontSize={fontSize}
          padding={5}
          gap={10}
          textColor={displayColor}
          fontWeight={fontWeight}
        />
      </div>
    </div>
  );
}

// 使用memo优化，只在props变化时重新渲染
export default memo(CounterDisplay);
