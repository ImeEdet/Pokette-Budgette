import {
  Download,
  Smartphone,
  WifiOff,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { type OfflineState } from "../pwa/useOffline";
import { Modal } from "./Modal";

export function OfflineStatus({ offline }: { offline: OfflineState }) {
  return (
    <div
      className={`offline-status ${offline.ready ? "ready" : ""}`}
      role="status"
    >
      {!offline.online ? <WifiOff size={14} /> : <CheckCircle2 size={14} />}
      <span>
        {!offline.online
          ? offline.ready
            ? "Offline · saved on this device"
            : "Offline · keep this page open"
          : offline.ready
            ? "Offline ready"
            : offline.error
              ? "Offline setup incomplete"
              : offline.enabled && offline.supported
                ? "Preparing offline access…"
                : offline.enabled
                  ? "Online · saved on this device"
                  : "Local preview"}
      </span>
    </div>
  );
}

export function OfflinePanel({ offline }: { offline: OfflineState }) {
  return (
    <section className="panel offline-panel">
      <span className="sticker sage">
        <Smartphone />
      </span>
      <h2>Your pocket-sized planner</h2>
      <OfflineStatus offline={offline} />
      <p>
        {offline.installed
          ? "Pokette is available from your home screen."
          : "Keep Pokette on your home screen, ready for little plans on the go."}
      </p>
      {offline.canInstall && !offline.installed && (
        <button
          className="button primary"
          disabled={offline.installing}
          onClick={() => void offline.install()}
        >
          <Download size={18} />
          {offline.installing ? "Opening installer…" : "Install Pokette"}
        </button>
      )}
      <details className="install-guide">
        <summary>Install on iPhone or Android</summary>
        <ol>
          <li>
            <strong>iPhone:</strong> open the secure Pokette address in Safari,
            tap Share, then Add to Home Screen (you may need to scroll the
            menu). Choose Open as Web App if offered, then Add.
          </li>
          <li>
            <strong>Android:</strong> open the secure address in Chrome. Tap
            Install Pokette above when available, or use the browser menu → Add
            to Home screen / Install app.
          </li>
          <li>
            Open the home-screen app while connected and wait for{" "}
            <strong>Offline ready</strong>. Then it can reopen without internet.
          </li>
        </ol>
      </details>
      {!offline.enabled && (
        <p className="hint">
          Offline caching is enabled in the production preview, not the
          development server. Run the offline preview launcher to test it.
        </p>
      )}
      {offline.enabled && !offline.supported && (
        <p className="hint">
          Offline installation needs HTTPS (or localhost on this device) and a
          browser that supports service workers.
        </p>
      )}
      <p className="hint">
        The computer’s 127.0.0.1 address is not a phone address. Phone
        installation needs a reachable HTTPS address; this project has not been
        deployed. Data stays in this browser or installed app and does not sync
        between devices. Clearing website data can remove records and offline
        access.
      </p>
      {offline.error && (
        <div role="alert" className="error">
          <p>{offline.error}</p>
          <button className="button secondary" onClick={offline.retry}>
            Retry offline setup
          </button>
        </div>
      )}
      <UpdateNotice offline={offline} />
    </section>
  );
}

export function UpdateNotice({ offline }: { offline: OfflineState }) {
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  if (!offline.updateAvailable) return null;
  return (
    <>
      {offline.updateAvailable && (
        <div className="update-notice" role="status">
          <p>
            A little refresh for Pokette ♡ A new version is ready. Your saved
            records will stay on this device.
          </p>
          <button
            className="button secondary"
            onClick={() => setConfirmUpdate(true)}
          >
            <RefreshCw size={16} /> Update app
          </button>
        </div>
      )}
      {confirmUpdate && (
        <Modal title="Update Pokette?" onClose={() => setConfirmUpdate(false)}>
          <p>
            This reloads the app. Finish any unsaved edits in other open Pokette
            tabs first. Saved records will be preserved.
          </p>
          <footer>
            <button
              className="button secondary"
              onClick={() => setConfirmUpdate(false)}
            >
              Not now
            </button>
            <button
              className="button primary"
              onClick={() => {
                setConfirmUpdate(false);
                void offline.applyUpdate();
              }}
            >
              Update & reload
            </button>
          </footer>
        </Modal>
      )}
      {offline.error && (
        <p className="error" role="alert">
          {offline.error}
        </p>
      )}
    </>
  );
}
