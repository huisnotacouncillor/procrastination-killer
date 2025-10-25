import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { TimerDisplaySelector } from "@/components/timer-displays";
import type { DisplayType } from "@/components/timer-displays";
import { useCountdown } from "@/hooks/use-countdown";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { KillerSettings } from "@/components/settings";

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

export default function App() {
  // 从 localStorage 读取配置
  const [focusMinutes, setFocusMinutes] = useState(() => {
    const stored = localStorage.getItem("focusMinutes");
    return stored ? parseInt(stored, 10) : DEFAULT_FOCUS_MINUTES;
  });

  const [breakMinutes, setBreakMinutes] = useState(() => {
    const stored = localStorage.getItem("breakMinutes");
    return stored ? parseInt(stored, 10) : DEFAULT_BREAK_MINUTES;
  });

  // 显示样式状态
  const [displayType, setDisplayType] = useState<DisplayType>(() => {
    const stored = localStorage.getItem("displayType");
    return (stored as DisplayType) || "counter";
  });

  // 使用ref避免不必要的重新创建回调
  const handleSessionCompleteRef = useRef<(session: "focus" | "break") => void>(
    () => {
      console.log("Session completed!");
    }
  );

  const handleCycleCompleteRef = useRef<() => void>(() => {
    console.log("Cycle completed!");
  });

  // 定义回调函数，使用useCallback避免不必要的重新渲染
  const handleSessionComplete = useCallback((session: "focus" | "break") => {
    console.log(`${session} session completed!`);
    handleSessionCompleteRef.current(session);
  }, []);

  const handleCycleComplete = useCallback(() => {
    console.log("Pomodoro cycle completed!");
    handleCycleCompleteRef.current();
  }, []);

  // 更新ref中的回调
  useEffect(() => {
    handleSessionCompleteRef.current = (session: "focus" | "break") => {
      console.log(`${session} session completed!`);
    };
  }, []);

  useEffect(() => {
    handleCycleCompleteRef.current = () => {
      console.log("Pomodoro cycle completed!");
    };
  }, []);

  // 番茄钟状态管理
  const pomodoro = usePomodoro({
    focusMinutes,
    breakMinutes,
    onSessionComplete: handleSessionComplete,
    onCycleComplete: handleCycleComplete,
  });

  // 更新番茄钟配置
  useEffect(() => {
    pomodoro.updateConfig({ focusMinutes, breakMinutes });
  }, [focusMinutes, breakMinutes, pomodoro.updateConfig]);

  // 根据当前会话类型获取时间 - 使用useMemo优化性能
  const currentTime = useMemo(() => {
    if (pomodoro.state.currentSession === "focus") {
      return { minutes: focusMinutes, seconds: 0 };
    } else {
      return { minutes: breakMinutes, seconds: 0 };
    }
  }, [pomodoro.state.currentSession, focusMinutes, breakMinutes]);

  // 使用ref存储handleSessionComplete回调，避免useEffect重新执行
  const handleSessionCompleteForCountdown = useCallback(() => {
    pomodoro.handleSessionComplete(pomodoro.state.currentSession);
  }, [pomodoro.handleSessionComplete, pomodoro.state.currentSession]);

  // 使用倒计时hook
  const countdown = useCountdown({
    initialMinutes: currentTime.minutes,
    initialSeconds: currentTime.seconds,
    onComplete: handleSessionCompleteForCountdown,
  });

  // 当会话类型改变时，重置倒计时
  useEffect(() => {
    countdown.reset();
    countdown.setTime(currentTime.minutes, currentTime.seconds);
    // 注意：这里故意不包含countdown的依赖，因为每次重置都会触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoro.state.currentSession, focusMinutes, breakMinutes]);

  // 显示类型切换
  const handleDisplayTypeChange = useCallback((type: DisplayType) => {
    setDisplayType(type);
    localStorage.setItem("displayType", type);
  }, []);

  // 专注时长变化
  const handleFocusMinutesChange = useCallback((minutes: number) => {
    setFocusMinutes(minutes);
    localStorage.setItem("focusMinutes", minutes.toString());
  }, []);

  // 休息时长变化
  const handleBreakMinutesChange = useCallback((minutes: number) => {
    setBreakMinutes(minutes);
    localStorage.setItem("breakMinutes", minutes.toString());
  }, []);

  // 获取会话状态文本
  const getSessionText = () => {
    if (pomodoro.state.currentSession === "focus") {
      return "专注";
    } else {
      return "休息";
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background dark:bg-zinc-900 group">
      <div className="flex px-4 py-3 items-center justify-between">
        {/* 番茄钟状态显示 */}
        <div className="flex items-center gap-4">
          <div className="text-lg font-semibold text-secondary-foreground">
            {getSessionText()}
          </div>
        </div>

        <KillerSettings
          focusMinutes={focusMinutes}
          breakMinutes={breakMinutes}
          displayType={displayType}
          onFocusMinutesChange={handleFocusMinutesChange}
          onBreakMinutesChange={handleBreakMinutesChange}
          onDisplayTypeChange={handleDisplayTypeChange}
        />
      </div>
      <div className="flex flex-auto flex-col items-center justify-center">
        <TimerDisplaySelector
          minutes={countdown.minutes}
          seconds={countdown.seconds}
          totalMinutes={currentTime.minutes}
          displayType={displayType}
        />
        <div className="flex items-center gap-2 mt-8 group-hover:opacity-100 opacity-0 transition-opacity duration-150">
          {!countdown.isRunning &&
            !countdown.isPaused &&
            !countdown.isEnded && (
              <Button variant="outline" onClick={countdown.start} size="lg">
              {
                pomodoro.state.currentSession === "focus" ? "开始专注" : "开始休息"
              }
                {/*开始专注*/}
              </Button>
            )}
          {countdown.isRunning && !countdown.isPaused && (
            <Button onClick={countdown.pause} size="lg" variant="secondary">
              暂停
            </Button>
          )}
          {countdown.isPaused && (
            <Button onClick={countdown.start} size="lg">
              继续
            </Button>
          )}
          {(countdown.isRunning || countdown.isPaused) && (
            <Button onClick={countdown.reset} size="lg" variant="destructive">
              退出
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
