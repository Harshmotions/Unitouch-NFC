export interface CardProps {
  variant: "default" | "elevated" | "outline";
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function Card({ className, children }: CardProps) {
  return <div className={className}>{children}</div>;
}
