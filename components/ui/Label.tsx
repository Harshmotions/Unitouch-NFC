export default function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`text-text-secondary mb-1.5 block text-sm font-[500] ${className ?? ""}`}
      {...props}
    />
  );
}
