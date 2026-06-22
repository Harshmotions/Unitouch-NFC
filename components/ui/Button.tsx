export interface ButtonProps {
  variant: "primary" | "secondary" | "ghost" | "danger";
  size: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  magnetic?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button({ children, disabled, onClick }: ButtonProps) {
  return (
    <button disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
