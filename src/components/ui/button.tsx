import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glow" | "cyan";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";
    
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 active:scale-[0.98]",
      destructive: "bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/20 active:scale-[0.98]",
      outline: "border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:border-slate-600 hover:text-white",
      secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700/80 active:scale-[0.98]",
      ghost: "text-slate-300 hover:bg-slate-800/60 hover:text-white",
      link: "text-blue-400 underline-offset-4 hover:underline",
      glow: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 active:scale-[0.98]",
      cyan: "bg-cyan-600 text-white hover:bg-cyan-500 shadow-md shadow-cyan-600/20 active:scale-[0.98]",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-lg px-6 text-base",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Memproses...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
