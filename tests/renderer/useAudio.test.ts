import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudio, MAX_RECORDING_MS } from "@renderer/hooks/useAudio";

function makeMockRecorder() {
  const recorder = {
    state: "inactive" as "inactive" | "recording",
    ondataavailable: null as ((e: { data: { size: number } }) => void) | null,
    onstop: null as (() => void) | null,
    stream: { getTracks: () => [{ stop: vi.fn() }] },
    start: vi.fn(() => {
      recorder.state = "recording";
    }),
    stop: vi.fn(() => {
      recorder.state = "inactive";
      recorder.onstop?.();
    }),
  };
  return recorder;
}

let mockRecorder: ReturnType<typeof makeMockRecorder>;

beforeEach(() => {
  mockRecorder = makeMockRecorder();

  vi.stubGlobal(
    "MediaRecorder",
    vi.fn().mockImplementation(function () {
      return mockRecorder;
    }),
  );

  // jsdom's navigator is non-configurable so we patch mediaDevices directly
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    writable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue({}) },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useAudio", () => {
  it("sets audioState to recording after startRecording", async () => {
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.audioState).toBe("recording");
  });

  it("auto-stops the recorder after MAX_RECORDING_MS", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockRecorder.state).toBe("recording");

    act(() => {
      vi.advanceTimersByTime(MAX_RECORDING_MS);
    });

    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  });

  it("does not auto-stop if already stopped manually before timer fires", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      await result.current.stopRecording();
    });

    const callsBefore = mockRecorder.stop.mock.calls.length;

    act(() => {
      vi.advanceTimersByTime(MAX_RECORDING_MS);
    });

    expect(mockRecorder.stop.mock.calls.length).toBe(callsBefore);
  });

  it("returns null from stopRecording when not recording", async () => {
    const { result } = renderHook(() => useAudio());

    const output = await act(async () => result.current.stopRecording());

    expect(output).toBeNull();
  });

  it("passes exact deviceId constraint to getUserMedia when provided", async () => {
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.startRecording("test-device-id");
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { deviceId: { exact: "test-device-id" } },
    });
  });

  it("uses plain audio:true when no deviceId is provided", async () => {
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true,
    });
  });
});
