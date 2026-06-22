export interface BadgeProps {
  variant: "default" | "green" | "purple" | "muted";
  size: "sm" | "md";
  children: React.ReactNode;
}

export default function Badge({ children }: BadgeProps) {
  return <span>{children}</span>;
}
