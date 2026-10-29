import Link from "next/link";
import { Loader2 } from "lucide-react";

export interface ButtonProps {
  variant: "primary" | "secondary" | "ghost" | "danger" | "ink";
  size: "sm" | "md" | "lg";
  type?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
  magnetic?: boolean;
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

/* Flat fills, one pill shape everywhere. Feedback is a tone step on hover
   and a small press, never a glow. */
const variantClasses: Record<ButtonProps["variant"], string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  ink: "bg-bg-ink text-text-on-ink hover:bg-black",
  secondary: "bg-bg-subtle text-text-primary hover:bg-bg-field",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary",
  danger: "bg-error/10 text-error hover:bg-error/15",
};

const sizeClasses: Record<ButtonProps["size"], string> = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-6 text-[0.9375rem]",
  lg: "h-14 px-8 text-base",
};

export default function Button({
  variant,
  size,
  type = "submit",
  loading,
  disabled,
  href,
  className,
  children,
  onClick,
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-[500] transition-[background-color,color,transform] duration-[180ms] ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
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
    <button type={type} disabled={disabled || loading} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
