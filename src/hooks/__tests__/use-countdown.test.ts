import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "@/hooks/use-countdown";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { vi } from "vitest";

// Mock Tauri API
vi.mock("@tauri-apps/api/core");
vi.mock("@tauri-apps/api/event");

const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);

// Helper to get event handlers
let tickHandler:
  | ((event: { payload: { remaining_ms: number } }) => void)
  | null = null;
let doneHandler: (() => void) | null = null;

beforeEach(() => {
  vi.useFakeTimers();

  // Reset mocks
  mockInvoke.mockClear();
  mockListen.mockClear();

  // Setup event listener mock
  mockListen.mockImplementation(async (eventName: string, handler: any) => {
    if (eventName === "timer://tick") {
      tickHandler = handler;
    } else if (eventName === "timer://done") {
      doneHandler = handler;
    }
    return Promise.resolve(() => {});
  });

  // Mock invoke for get_timer_remaining to return null by default
  mockInvoke.mockImplementation(async (cmd: string, args?: any) => {
    if (cmd === "get_timer_remaining") {
      return null;
    }
    return undefined;
  });
});

afterEach(() => {
  vi.useRealTimers();
  tickHandler = null;
  doneHandler = null;
});

// Helper to emit tick events
const emitTick = (remainingMs: number) => {
  if (tickHandler) {
    act(() => {
      tickHandler!({ payload: { remaining_ms: remainingMs } });
    });
  }
};

// Helper to emit done event
const emitDone = () => {
  if (doneHandler) {
    act(() => {
      doneHandler!();
    });
  }
};

describe("useCountdown", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useCountdown());

    expect(result.current.minutes).toBe(25);
    expect(result.current.seconds).toBe(0);
    expect(result.current.totalSeconds).toBe(1500);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isEnded).toBe(false);
  });

  it("should initialize with custom values", () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 5, initialSeconds: 30 })
    );

    expect(result.current.minutes).toBe(5);
    expect(result.current.seconds).toBe(30);
    expect(result.current.totalSeconds).toBe(330);
  });

  it("should start countdown", async () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 0, initialSeconds: 3 })
    );

    await act(async () => {
      await result.current.start();
    });

    expect(mockInvoke).toHaveBeenCalledWith("start_timer", { totalMs: 3000 });
    expect(result.current.isRunning).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  it("should countdown correctly", async () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 0, initialSeconds: 3 })
    );

    await act(async () => {
      await result.current.start();
    });

    // Emit tick for 2000ms remaining (1 second elapsed)
    await act(async () => {
      emitTick(2000);
      await vi.runAllTimersAsync();
    });

    expect(result.current.totalSeconds).toBe(2);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(2);

    // Emit tick for 1000ms remaining (2 seconds elapsed)
    await act(async () => {
      emitTick(1000);
      await vi.runAllTimersAsync();
    });

    expect(result.current.totalSeconds).toBe(1);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(1);
  });

  it("should pause countdown", async () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 0, initialSeconds: 3 })
    );

    await act(async () => {
      await result.current.start();
    });

    await act(async () => {
      emitTick(2000); // 2 seconds remaining
      await vi.runAllTimersAsync();
    });

    await act(async () => {
      await result.current.pause();
    });

    expect(mockInvoke).toHaveBeenCalledWith("pause_timer");
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(true);

    // Timer should not advance when paused - emit another tick but state should not change
    const initialSeconds = result.current.totalSeconds;
    await act(async () => {
      emitTick(2000); // Try to emit same tick
      await vi.runAllTimersAsync();
    });

    expect(result.current.totalSeconds).toBe(initialSeconds);
  });

  it("should resume countdown", async () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 0, initialSeconds: 3 })
    );

    await act(async () => {
      await result.current.start();
    });

    await act(async () => {
      emitTick(2000);
      await vi.runAllTimersAsync();
    });

    await act(async () => {
      await result.current.pause();
    });

    await act(async () => {
      await result.current.start(); // Resume
    });

    expect(mockInvoke).toHaveBeenCalledWith("resume_timer");
    expect(result.current.isRunning).toBe(true);
    expect(result.current.isPaused).toBe(false);

    // Emit tick showing timer has advanced
    await act(async () => {
      emitTick(1000);
      await vi.runAllTimersAsync();
    });

    expect(result.current.totalSeconds).toBe(1);
  });

  it("should stop countdown", async () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 0, initialSeconds: 3 })
    );

    await act(async () => {
      await result.current.start();
    });

    emitTick(2000);

    await act(async () => {
      await result.current.stop();
    });

    expect(mockInvoke).toHaveBeenCalledWith("stop_timer");
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isEnded).toBe(true);
  });

  it("should reset countdown", async () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 1, initialSeconds: 30 })
    );

    await act(async () => {
      await result.current.start();
    });

    await act(async () => {
      emitTick(88000); // 88 seconds remaining
      await vi.runAllTimersAsync();
    });

    expect(result.current.totalSeconds).toBe(88);

    await act(async () => {
      await result.current.reset();
    });

    expect(mockInvoke).toHaveBeenCalledWith("stop_timer");
    expect(result.current.totalSeconds).toBe(90);
    expect(result.current.minutes).toBe(1);
    expect(result.current.seconds).toBe(30);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isEnded).toBe(false);
  });

  it("should set custom time", async () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 5, initialSeconds: 0 })
    );

    await act(async () => {
      await result.current.setTime(2, 30);
    });

    expect(mockInvoke).toHaveBeenCalledWith("stop_timer");
    expect(result.current.totalSeconds).toBe(150);
    expect(result.current.minutes).toBe(2);
    expect(result.current.seconds).toBe(30);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isEnded).toBe(false);
  });

  it("should handle minutes and seconds conversion correctly", async () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 1, initialSeconds: 30 })
    );

    await act(async () => {
      await result.current.start();
    });

    // Emit tick showing 59 seconds remaining (31 seconds elapsed)
    await act(async () => {
      emitTick(59000);
      await vi.runAllTimersAsync();
    });

    expect(result.current.totalSeconds).toBe(59);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(59);
  });

  it("should call onComplete when timer finishes", async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 0, initialSeconds: 3, onComplete })
    );

    await act(async () => {
      await result.current.start();
    });

    await act(async () => {
      emitTick(1000);
      await vi.runAllTimersAsync();
    });

    // Emit done event
    await act(async () => {
      emitDone();
      await vi.runAllTimersAsync();
    });

    expect(onComplete).toHaveBeenCalled();
    expect(result.current.isEnded).toBe(true);
    expect(result.current.totalSeconds).toBe(0);
  });
});
