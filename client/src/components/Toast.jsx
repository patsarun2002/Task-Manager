import { useEffect } from "react";

export default function Toast({ message, type = "error", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-blue-600 text-white",
  };

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-xs animate-in fade-in slide-in-from-bottom-2 ${styles[type] ?? styles.error}`}
    >
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-white/20 rounded-full text-xs">
        {icons[type] ?? icons.error}
      </span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity text-lg leading-none"
      >
        ✕
      </button>
    </div>
  );
}
