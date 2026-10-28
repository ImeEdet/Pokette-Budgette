import { useCallback, useEffect, useRef, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function useOffline() {
  const [online, setOnline] = useState(navigator.onLine);
  const [ready, setReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [error, setError] = useState("");
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia?.("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  );
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(
    null,
  );
  const [installing, setInstalling] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const updater = useRef<((reload?: boolean) => Promise<void>) | null>(null);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const reloadRequested = useRef(false);
  const reloadNeeded = useRef(false);
  const enabled = import.meta.env.PROD;
  const supported = "serviceWorker" in navigator && window.isSecureContext;

  useEffect(() => {
    const connection = () => {
      setOnline(navigator.onLine);
    };
    const offer = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const installedNow = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    window.addEventListener("beforeinstallprompt", offer);
    window.addEventListener("appinstalled", installedNow);
    return () => {
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      window.removeEventListener("beforeinstallprompt", offer);
      window.removeEventListener("appinstalled", installedNow);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !supported) return;
    let disposed = false;
    let checking = false;
    const checkForUpdate = async () => {
      const reg = registration.current;
      if (
        disposed ||
        checking ||
        !reg ||
        !navigator.onLine ||
        document.visibilityState === "hidden"
      )
        return;
      if (reg.waiting) {
        setUpdateAvailable(true);
        return;
      }
      checking = true;
      try {
        await reg.update();
        if (!disposed && reg.waiting) setUpdateAvailable(true);
      } catch {
        // A failed background check must not interrupt offline work.
      } finally {
        checking = false;
      }
    };
    const interval = window.setInterval(() => void checkForUpdate(), 60_000);
    window.addEventListener("focus", checkForUpdate);
    window.addEventListener("online", checkForUpdate);
    document.addEventListener("visibilitychange", checkForUpdate);
    setError("");
    void import("virtual:pwa-register")
      .then(({ registerSW }) => {
        if (disposed) return;
        updater.current = registerSW({
          immediate: true,
          onOfflineReady: () => {
            if (!disposed) setReady(true);
          },
          onNeedRefresh: () => {
            if (!disposed) setUpdateAvailable(true);
          },
          onNeedReload: () => {
            if (reloadRequested.current) window.location.reload();
            else if (!disposed) {
              reloadNeeded.current = true;
              setUpdateAvailable(true);
            }
          },
          onRegisteredSW: (_url, reg) => {
            if (disposed) return;
            registration.current = reg ?? null;
            void checkForUpdate();
            if (reg?.active && !disposed) setReady(true);
            const worker = reg?.installing;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "redundant" && !disposed)
                setError(
                  "Offline setup did not finish. Stay connected and try again.",
                );
            });
          },
          onRegisterError: () => {
            if (!disposed)
              setError(
                "Offline setup did not finish. Stay connected and try again.",
              );
          },
        });
      })
      .catch(() => {
        if (!disposed)
          setError("Offline setup could not load. Reconnect and try again.");
      });
    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", checkForUpdate);
      window.removeEventListener("online", checkForUpdate);
      document.removeEventListener("visibilitychange", checkForUpdate);
      registration.current = null;
    };
  }, [enabled, supported, attempt]);

  const install = useCallback(async () => {
    if (!installPrompt || installing) return;
    setInstalling(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallPrompt(null);
    } catch {
      setError(
        "The install prompt could not open. Use your browser’s Add to Home Screen menu.",
      );
    } finally {
      setInstalling(false);
    }
  }, [installPrompt, installing]);
  async function applyUpdate() {
    try {
      reloadRequested.current = true;
      if (reloadNeeded.current) window.location.reload();
      else await updater.current?.(true);
    } catch {
      setError(
        "The update could not be applied. Your saved records are unchanged. Try again when connected.",
      );
    }
  }
  return {
    online,
    ready,
    updateAvailable,
    error,
    installed,
    canInstall: !!installPrompt,
    installing,
    install,
    applyUpdate,
    retry: () => setAttempt((n) => n + 1),
    enabled,
    supported,
  };
}
export type OfflineState = ReturnType<typeof useOffline>;
