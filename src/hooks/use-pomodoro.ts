import { useState, useCallback, useRef, useEffect } from "react";

export type PomodoroSession = "focus" | "break";

export interface PomodoroConfig {
  focusMinutes: number;
  breakMinutes: number;
  onSessionComplete?: (session: PomodoroSession) => void;
  onCycleComplete?: () => void;
}

export interface PomodoroState {
  currentSession: PomodoroSession;
  sessionCount: number;
  totalCycles: number;
  isActive: boolean;
}

export interface UsePomodoroReturn {
  // 状态
  state: PomodoroState;
  config: PomodoroConfig;

  // 控制方法
  startSession: () => void;
  pauseSession: () => void;
  stopSession: () => void;
  resetSession: () => void;
  switchToBreak: () => void;
  switchToFocus: () => void;
  handleSessionComplete: (session: PomodoroSession) => void;

  // 配置方法
  updateConfig: (newConfig: Partial<PomodoroConfig>) => void;
}

export function usePomodoro(initialConfig: PomodoroConfig): UsePomodoroReturn {
  const [config, setConfig] = useState<PomodoroConfig>(initialConfig);
  const [state, setState] = useState<PomodoroState>({
    currentSession: "focus",
    sessionCount: 0,
    totalCycles: 0,
    isActive: false,
  });

  // 使用ref存储回调和配置，避免不必要的重新渲染和闭包问题
  const configRef = useRef(config);
  const stateRef = useRef(state);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 更新配置
  const updateConfig = useCallback((newConfig: Partial<PomodoroConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  // 开始会话
  const startSession = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: true }));
  }, []);

  // 暂停会话
  const pauseSession = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: false }));
  }, []);

  // 停止会话
  const stopSession = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: false }));
  }, []);

  // 重置会话
  const resetSession = useCallback(() => {
    setState({
      currentSession: "focus",
      sessionCount: 0,
      totalCycles: 0,
      isActive: false,
    });
  }, []);

  // 切换到休息
  const switchToBreak = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSession: "break",
      isActive: false,
    }));
  }, []);

  // 切换到专注
  const switchToFocus = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSession: "focus",
      sessionCount: prev.sessionCount + 1,
      isActive: false,
    }));
  }, []);

  // 处理会话完成 - 使用ref避免闭包问题，并处理竞态条件
  const handleSessionComplete = useCallback((session: PomodoroSession) => {
    if (session === "focus") {
      // 专注完成，切换到休息
      const currentState = stateRef.current;
      setState({
        ...currentState,
        currentSession: "break",
        isActive: false,
      });
      configRef.current.onSessionComplete?.(session);
    } else if (session === "break") {
      // 休息完成，切换到专注，并增加周期数
      const currentState = stateRef.current;
      const newState = {
        ...currentState,
        currentSession: "focus" as const,
        sessionCount: currentState.sessionCount + 1,
        totalCycles: currentState.totalCycles + 1,
        isActive: false,
      };
      setState(newState);
      configRef.current.onSessionComplete?.(session);
      configRef.current.onCycleComplete?.();
    }
  }, []);

  return {
    state,
    config,
    startSession,
    pauseSession,
    stopSession,
    resetSession,
    switchToBreak,
    switchToFocus,
    updateConfig,
    handleSessionComplete,
  };
}
