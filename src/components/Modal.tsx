import { useEffect, useRef, useId, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const d = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const viewport = window.visualViewport;
    const resize = () => {
      d?.style.setProperty(
        "--visual-height",
        `${viewport?.height ?? window.innerHeight}px`,
      );
      d?.style.setProperty(
        "--visual-bottom",
        `${Math.max(0, window.innerHeight - (viewport?.height ?? window.innerHeight) - (viewport?.offsetTop ?? 0))}px`,
      );
    };
    resize();
    viewport?.addEventListener("resize", resize);
    d?.showModal();
    return () => {
      d?.close();
      viewport?.removeEventListener("resize", resize);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
      className="modal"
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
