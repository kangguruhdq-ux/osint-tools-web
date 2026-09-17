import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, rightElement, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors duration-200 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-10",
            rightElement && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
