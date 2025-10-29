import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => {
  return {
    invoke: vi.fn(),
  };
});

vi.mock("@tauri-apps/api/event", () => {
  const eventListeners: Record<string, Array<(payload: any) => void>> = {};

  return {
    listen: vi.fn(
      (eventName: string, handler: (event: { payload: any }) => void) => {
        if (!eventListeners[eventName]) {
          eventListeners[eventName] = [];
        }
        eventListeners[eventName].push(handler);

        // Return unlisten function
        return Promise.resolve(() => {
          const index = eventListeners[eventName].indexOf(handler);
          if (index > -1) {
            eventListeners[eventName].splice(index, 1);
          }
        });
      }
    ),
  };
});
