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
  onClick?: (e: React.MouseEvent) => void;
}

const variantClasses: Record<ButtonProps["variant"], string> = {
  primary:
    "bg-accent-purple text-bg-base shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_30px_-12px_var(--color-accent-purple-glow)] hover:-translate-y-px hover:brightness-[1.07] active:translate-y-0",
  secondary: "glass text-text-secondary hover:-translate-y-px hover:text-text-primary",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary",
  danger: "border border-error/40 bg-error/10 text-error hover:bg-error/15",
};

const sizeClasses: Record<ButtonProps["size"], string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-base",
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
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-display font-[500] transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none",
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
      <Link href={href} onClick={onClick} className={classes}>
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
