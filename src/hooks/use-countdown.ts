import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface UseCountdownOptions {
  initialMinutes?: number;
  initialSeconds?: number;
  onComplete?: () => void;
}

export interface UseCountdownReturn {
  // 时间状态
  totalSeconds: number;
  minutes: number;
  seconds: number;

  // 控制状态
  isRunning: boolean;
  isPaused: boolean;
  isEnded: boolean;

  // 控制方法
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;

  // 设置方法
  setTime: (minutes: number, seconds: number) => void;
}

interface TickPayload {
  remaining_ms: number;
}

export function useCountdown({
  initialMinutes = 25,
  initialSeconds = 0,
  onComplete,
}: UseCountdownOptions = {}): UseCountdownReturn {
  // 计算初始总秒数
  const initialTotalSeconds = initialMinutes * 60 + initialSeconds;

  // 状态管理
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [currentTotalSeconds, setCurrentTotalSeconds] =
    useState(initialTotalSeconds);

  // 使用ref存储回调，避免闭包过期问题
  const onCompleteRef = useRef(onComplete);

  // 更新ref中的回调
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // 同步定时器状态的函数
  const syncTimerState = useCallback(async () => {
    try {
      const remaining = await invoke<number | null>("get_timer_remaining");
      if (remaining !== null) {
        const remainingSeconds = Math.ceil(remaining / 1000);
        setCurrentTotalSeconds(remainingSeconds);
        // 如果还有剩余时间且不为0，说明正在运行或暂停
        if (remainingSeconds > 0) {
          // 状态由 isRunning 和 isPaused 控制，这里只同步时间
        } else if (remainingSeconds === 0 && (isRunning || isPaused)) {
          // 时间到了但还没收到完成事件，触发完成
          setIsRunning(false);
          setIsPaused(false);
          setIsEnded(true);
          onCompleteRef.current?.();
        }
      } else {
        // 返回 null 说明定时器已停止
        if (isRunning && !isPaused) {
          setIsRunning(false);
          setIsEnded(true);
        }
      }
    } catch (error) {
      console.error("Failed to sync timer state:", error);
    }
  }, [isRunning, isPaused]);

  // 监听 Rust 定时器事件
  useEffect(() => {
    let unlistenTick: UnlistenFn | null = null;
    let unlistenDone: UnlistenFn | null = null;

    const setupListeners = async () => {
      try {
        // 监听 tick 事件
        unlistenTick = await listen<TickPayload>("timer://tick", (event) => {
          const remaining = Math.ceil(event.payload.remaining_ms / 1000);
          setCurrentTotalSeconds(remaining);
        });

        // 监听完成事件
        unlistenDone = await listen("timer://done", () => {
          setCurrentTotalSeconds(0);
          setIsRunning(false);
          setIsEnded(true);
          onCompleteRef.current?.();
        });
      } catch (error) {
        console.error("Failed to set up timer listeners:", error);
      }
    };

    setupListeners();

    return () => {
      if (unlistenTick) unlistenTick();
      if (unlistenDone) unlistenDone();
    };
  }, []);

  // 监听页面可见性变化，当窗口重新可见时同步定时器状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && (isRunning || isPaused)) {
        // 窗口重新可见且定时器正在运行或暂停，同步状态
        syncTimerState();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 窗口重新聚焦时也同步一次
    const handleFocus = () => {
      if (isRunning || isPaused) {
        syncTimerState();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isRunning, isPaused, syncTimerState]);

  // 计算分钟和秒数 - 使用useMemo优化性能
  const totalSeconds = useMemo(() => {
    if (isRunning || isPaused) {
      return currentTotalSeconds;
    }
    // 如果不在运行状态，使用设置的初始值或当前设置的值
    return currentTotalSeconds;
  }, [currentTotalSeconds, isRunning, isPaused]);

  const { minutes, seconds } = useMemo(
    () => ({
      minutes: Math.floor(totalSeconds / 60),
      seconds: totalSeconds % 60,
    }),
    [totalSeconds]
  );

  // 开始计时
  const start = useCallback(async () => {
    try {
      if (isEnded) {
        // 如果已结束，先重置时间
        const totalMs = initialTotalSeconds * 1000;
        setCurrentTotalSeconds(initialTotalSeconds);
        setIsEnded(false);
        await invoke("start_timer", { totalMs });
      } else if (isPaused) {
        // 如果暂停中，恢复计时
        await invoke("resume_timer");
      } else {
        // 正常开始，使用当前的 totalSeconds
        const totalMs = totalSeconds * 1000;
        await invoke("start_timer", { totalMs });
      }
      setIsRunning(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  }, [isEnded, isPaused, initialTotalSeconds, totalSeconds]);

  // 暂停计时
  const pause = useCallback(async () => {
    try {
      await invoke("pause_timer");
      setIsPaused(true);
      setIsRunning(false);
    } catch (error) {
      console.error("Failed to pause timer:", error);
    }
  }, []);

  // 结束计时
  const stop = useCallback(async () => {
    try {
      await invoke("stop_timer");
      setIsRunning(false);
      setIsPaused(false);
      setIsEnded(true);
    } catch (error) {
      console.error("Failed to stop timer:", error);
    }
  }, []);

  // 重置计时器
  const reset = useCallback(async () => {
    try {
      await invoke("stop_timer");
      setCurrentTotalSeconds(initialTotalSeconds);
      setIsRunning(false);
      setIsPaused(false);
      setIsEnded(false);
    } catch (error) {
      console.error("Failed to reset timer:", error);
    }
  }, [initialTotalSeconds]);

  // 设置时间
  const setTime = useCallback(async (minutes: number, seconds: number) => {
    try {
      await invoke("stop_timer");
      const newTotalSeconds = minutes * 60 + seconds;
      setCurrentTotalSeconds(newTotalSeconds);
      setIsRunning(false);
      setIsPaused(false);
      setIsEnded(false);
    } catch (error) {
      console.error("Failed to set time:", error);
    }
  }, []);

  return {
    // 时间状态
    totalSeconds,
    minutes,
    seconds,

    // 控制状态
    isRunning,
    isPaused,
    isEnded,

    // 控制方法
    start,
    pause,
    stop,
    reset,

    // 设置方法
    setTime,
  };
}
