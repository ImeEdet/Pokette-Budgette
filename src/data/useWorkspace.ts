import { useEffect, useRef, useState } from "react";
import { generateBills } from "../domain/planning";
import { type State, emptyState } from "../domain/model";
import { validateState } from "../domain/validation";
import { load, persist, demoState } from "./storage";
export function useWorkspace() {
  const [initial] = useState(() => {
    try {
      return { state: load(), error: "" };
    } catch (e) {
      return { state: null, error: (e as Error).message };
    }
  });
  const [state, setState] = useState<State | null>(initial.state);
  const saved = useRef(initial.state);
  const [error, setError] = useState(initial.error);
  const demo = useRef(false);
  const [inDemo, setInDemo] = useState(false);
  function enterDemo() {
    demo.current = true;
    setInDemo(true);
    setState(demoState());
    setError("");
  }
  function restoreDemo(next: State) {
    validateState(next);
    demo.current = true;
    setInDemo(true);
    setState({ ...next, mode: "demo" });
    setError("");
  }
  function exitDemo() {
    try {
      const personal = load();
      demo.current = false;
      setInDemo(false);
      saved.current = personal;
      setState(personal);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function commit(next: State, backupLegacy = true) {
    try {
      if (demo.current) {
        validateState(next);
        setState({ ...next, mode: "demo" });
        setError("");
        return true;
      }
      if (JSON.stringify(load()) !== JSON.stringify(saved.current)) {
        setError(
          "This workspace changed in another tab. Reload before editing to avoid overwriting newer records.",
        );
        return false;
      }
      persist(next, backupLegacy);
      saved.current = next;
      setState(next);
      setError("");
      return true;
    } catch {
      setError(
        "Your change could not be saved. Device storage may be full or unavailable. Please free space and try again.",
      );
      return false;
    }
  }
  function clearRecords() {
    if (demo.current) return commit(emptyState("demo"));
    try {
      localStorage.removeItem("pokette.backup.before-v2");
      return commit(emptyState(), false);
    } catch {
      setError("Could not clear records. Please try again.");
      return false;
    }
  }
  useEffect(() => {
    if (!state) return;
    try {
      const next = generateBills(state);
      if (next !== state) commit(next);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [state]);
  return {
    state,
    commit,
    error,
    inDemo,
    enterDemo,
    restoreDemo,
    exitDemo,
    clearRecords,
    blocked: !!initial.error,
  };
}
