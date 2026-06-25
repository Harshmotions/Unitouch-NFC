import { forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`border-bg-border bg-bg-elevated text-text-primary placeholder:text-text-muted h-11 w-full rounded-xl border px-4 text-sm outline-none transition-colors focus:border-accent-purple/50 ${className ?? ""}`}
        {...props}
      />
    );
  }
);

export default Input;
