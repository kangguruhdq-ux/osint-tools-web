"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (options: { title?: string; message: string; type?: ToastType }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = "info" }: { title?: string; message: string; type?: ToastType }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => addToast({ title, message, type: "success" }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ title, message, type: "error" }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ title, message, type: "warning" }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ title, message, type: "info" }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md w-full px-4 sm:px-0">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
            error: <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />,
            warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
            info: <Info className="h-5 w-5 text-blue-400 shrink-0" />,
          };

          const borders = {
            success: "border-emerald-500/30 bg-slate-900/95 text-emerald-300",
            error: "border-red-500/30 bg-slate-900/95 text-red-300",
            warning: "border-amber-500/30 bg-slate-900/95 text-amber-300",
            info: "border-blue-500/30 bg-slate-900/95 text-blue-300",
          };

          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 rounded-lg border p-4 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 ${borders[t.type]}`}
            >
              {icons[t.type]}
              <div className="flex-1 text-sm">
                {t.title && <div className="font-semibold text-white mb-0.5">{t.title}</div>}
                <div className="text-slate-300">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
