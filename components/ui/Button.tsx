import Link from "next/link";
import { Loader2 } from "lucide-react";

export interface ButtonProps {
  variant: "primary" | "secondary" | "ghost" | "danger";
  size: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  magnetic?: boolean;
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const variantClasses: Record<ButtonProps["variant"], string> = {
  primary:
    "bg-accent-purple text-bg-base shadow-[0_8px_28px_var(--color-accent-purple-glow-soft)] hover:brightness-110",
  secondary:
    "border border-white/15 bg-white/[0.04] text-text-secondary hover:bg-white/[0.08] hover:text-text-primary",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:underline",
  danger: "bg-error/10 border border-error text-error hover:bg-error/20",
};

const sizeClasses: Record<ButtonProps["size"], string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-body",
  lg: "px-8 py-4 text-body-lg",
};

export default function Button({
  variant,
  size,
  loading,
  disabled,
  href,
  className,
  children,
  onClick,
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-full font-display font-[500] transition-colors disabled:opacity-50 disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button disabled={disabled || loading} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
