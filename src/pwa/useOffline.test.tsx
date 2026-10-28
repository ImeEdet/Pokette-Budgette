import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useOffline } from "./useOffline";
import { OfflinePanel } from "../components/OfflinePanel";
const { register, update } = vi.hoisted(() => ({
  register: vi.fn(),
  update: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("virtual:pwa-register", () => ({ registerSW: register }));
function Harness() {
  return <OfflinePanel offline={useOffline()} />;
}
beforeEach(() => {
  register.mockReset();
  register.mockReturnValue(update);
  update.mockClear();
  vi.stubEnv("PROD", true);
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("navigator", { onLine: true, serviceWorker: {} });
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("offline/install lifecycle", () => {
  it("detects an update while open without refreshing or applying it", async () => {
    const mounted = render(<Harness />);
    await waitFor(() => expect(register).toHaveBeenCalled());
    const reg = {
      active: {},
      waiting: null as object | null,
      update: vi.fn().mockResolvedValue(undefined),
    };
    await act(async () =>
      register.mock.calls[0][0].onRegisteredSW("/sw.js", reg),
    );
    expect(reg.update).toHaveBeenCalledOnce();
    // Timers are created on mount; focus also checks a new build immediately.
    reg.update.mockImplementation(async () => {
      reg.waiting = {};
    });
    await act(async () => fireEvent(window, new Event("focus")));
    expect(screen.getByRole("button", { name: "Update app" })).toBeVisible();
    expect(update).not.toHaveBeenCalled();
    mounted.unmount();
    reg.update.mockClear();
    await act(async () => fireEvent(window, new Event("focus")));
    expect(reg.update).not.toHaveBeenCalled();
  });
  it("polls visible online tabs, skips hidden/offline tabs, and recovers from failed checks", async () => {
    const interval = vi.spyOn(window, "setInterval");
    const mounted = render(<Harness />);
    await waitFor(() => expect(register).toHaveBeenCalled());
    const check = interval.mock.calls.find(
      (call) => call[1] === 60_000,
    )![0] as () => void;
    const reg = {
      active: {},
      waiting: null,
      update: vi.fn().mockRejectedValue(new Error("offline server")),
    };
    await act(async () =>
      register.mock.calls[0][0].onRegisteredSW("/sw.js", reg),
    );
    reg.update.mockResolvedValue(undefined);
    await act(async () => check());
    expect(reg.update).toHaveBeenCalledTimes(2);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    await act(async () => check());
    expect(reg.update).toHaveBeenCalledTimes(2);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    await act(async () => check());
    expect(reg.update).toHaveBeenCalledTimes(2);
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
    await act(async () => fireEvent(window, new Event("online")));
    expect(reg.update).toHaveBeenCalledTimes(3);
    mounted.unmount();
    await act(async () => check());
    expect(reg.update).toHaveBeenCalledTimes(3);
  });
  it("reports ready only after caching and responds to connection changes", async () => {
    render(<Harness />);
    expect(
      screen.queryByText("Offline ready", { selector: "span" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(register).toHaveBeenCalled());
    act(() => register.mock.calls[0][0].onOfflineReady());
    expect(
      screen.getByText("Offline ready", { selector: "span" }),
    ).toBeInTheDocument();
    act(() => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        configurable: true,
      });
      fireEvent(window, new Event("offline"));
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Offline · saved on this device",
    );
  });
  it("shows registration failure without claiming offline readiness", async () => {
    render(<Harness />);
    await waitFor(() => expect(register).toHaveBeenCalled());
    act(() => register.mock.calls[0][0].onRegisterError(new Error("network")));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Offline setup did not finish",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Offline setup incomplete",
    );
  });
  it("waits for explicit confirmation before applying an update", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await waitFor(() => expect(register).toHaveBeenCalled());
    act(() => register.mock.calls[0][0].onNeedRefresh());
    expect(update).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Update app" }));
    expect(update).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Update & reload" }));
    expect(update).toHaveBeenCalledWith(true);
  });
  it("shows the install action only when the browser supplies a prompt", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(
      screen.queryByRole("button", { name: "Install Pokette" }),
    ).not.toBeInTheDocument();
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    act(() => window.dispatchEvent(event));
    await user.click(screen.getByRole("button", { name: "Install Pokette" }));
    expect(prompt).toHaveBeenCalledOnce();
    expect(
      screen.getByText("Pokette is available from your home screen."),
    ).toBeInTheDocument();
  });
});
