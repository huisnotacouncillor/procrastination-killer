import { useState, useRef, useEffect, useMemo, useCallback } from "react";

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

export function useCountdown({
  initialMinutes = 25,
  initialSeconds = 0,
  onComplete,
}: UseCountdownOptions = {}): UseCountdownReturn {
  // 计算初始总秒数
  const initialTotalSeconds = initialMinutes * 60 + initialSeconds;

  // 状态管理
  const [totalSeconds, setTotalSeconds] = useState(initialTotalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  // 定时器引用
  const intervalRef = useRef<number | null>(null);
  // 使用ref存储回调，避免闭包过期问题
  const onCompleteRef = useRef(onComplete);

  // 更新ref中的回调
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // 计算分钟和秒数 - 使用useMemo优化性能
  const { minutes, seconds } = useMemo(
    () => ({
      minutes: Math.floor(totalSeconds / 60),
      seconds: totalSeconds % 60,
    }),
    [totalSeconds]
  );

  // 清理定时器
  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    // 先清理之前的定时器
    clearTimer();

    // 只有在运行且未暂停时才创建新定时器
    if (isRunning && !isPaused) {
      intervalRef.current = window.setInterval(() => {
        setTotalSeconds((prevTotalSeconds) => {
          if (prevTotalSeconds > 0) {
            return prevTotalSeconds - 1;
          } else {
            // 计时结束，清理定时器
            clearTimer();
            setIsRunning(false);
            setIsEnded(true);
            // 调用完成回调 - 使用ref避免闭包问题
            onCompleteRef.current?.();
            return 0;
          }
        });
      }, 1000);
    }

    // 清理函数
    return () => {
      clearTimer();
    };
  }, [isRunning, isPaused, clearTimer]);

  // 开始计时
  const start = useCallback(() => {
    if (isEnded) {
      // 如果已结束，先重置
      setTotalSeconds(initialTotalSeconds);
      setIsEnded(false);
    }
    setIsRunning(true);
    setIsPaused(false);
  }, [isEnded, initialTotalSeconds]);

  // 暂停计时
  const pause = useCallback(() => {
    setIsPaused(true);
    setIsRunning(false);
  }, []);

  // 结束计时
  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setIsEnded(true);
  }, []);

  // 重置计时器
  const reset = useCallback(() => {
    setTotalSeconds(initialTotalSeconds);
    setIsRunning(false);
    setIsPaused(false);
    setIsEnded(false);
  }, [initialTotalSeconds]);

  // 设置时间
  const setTime = useCallback((minutes: number, seconds: number) => {
    const newTotalSeconds = minutes * 60 + seconds;
    setTotalSeconds(newTotalSeconds);
    setIsRunning(false);
    setIsPaused(false);
    setIsEnded(false);
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
