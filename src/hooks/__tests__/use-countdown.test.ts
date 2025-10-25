import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "@/hooks/use-countdown";

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

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

  it("should start countdown", () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 0, initialSeconds: 3 })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  it("should countdown correctly", () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 0, initialSeconds: 3 })
    );

    act(() => {
      result.current.start();
    });

    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.totalSeconds).toBe(2);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(2);

    // Advance timer by another second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.totalSeconds).toBe(1);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(1);
  });

  it("should pause countdown", () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 0, initialSeconds: 3 })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(true);

    // Timer should not advance when paused
    const initialSeconds = result.current.totalSeconds;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.totalSeconds).toBe(initialSeconds);
  });

  it("should resume countdown", () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 0, initialSeconds: 3 })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.pause();
    });

    act(() => {
      result.current.start(); // Resume
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.isPaused).toBe(false);

    // Timer should advance again
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.totalSeconds).toBe(2);
  });

  it("should stop countdown", () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 0, initialSeconds: 3 })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isEnded).toBe(true);

    // Timer should not advance when stopped
    const initialSeconds = result.current.totalSeconds;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.totalSeconds).toBe(initialSeconds);
  });

  it("should reset countdown", () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 1, initialSeconds: 30 })
    );

    act(() => {
      result.current.start();
    });

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.totalSeconds).toBe(88); // 90 - 2

    act(() => {
      result.current.reset();
    });

    expect(result.current.totalSeconds).toBe(90);
    expect(result.current.minutes).toBe(1);
    expect(result.current.seconds).toBe(30);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isEnded).toBe(false);
  });

  it("should set custom time", () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 5, initialSeconds: 0 })
    );

    act(() => {
      result.current.setTime(2, 30);
    });

    expect(result.current.totalSeconds).toBe(150);
    expect(result.current.minutes).toBe(2);
    expect(result.current.seconds).toBe(30);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isEnded).toBe(false);
  });

  it("should handle minutes and seconds conversion correctly", () => {
    const { result } = renderHook(() =>
      useCountdown({ initialMinutes: 1, initialSeconds: 30 })
    );

    act(() => {
      result.current.start();
    });

    // Advance timer by 31 seconds (1 minute 1 second)
    act(() => {
      vi.advanceTimersByTime(31000);
    });

    expect(result.current.totalSeconds).toBe(59);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(59);
  });
});
