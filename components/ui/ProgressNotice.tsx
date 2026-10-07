import { Loader2 } from "lucide-react";

/* "Something is happening, please wait" feedback for slow async steps
   (payment setup, payment confirmation, sign-in redirect, publishing).

   - inline (default): a spinner row placed near the button that started it.
   - overlay: a full-screen blocking layer for steps the user must not
     interrupt (confirming a payment). */
export default function ProgressNotice({
  title,
  hint,
  overlay = false,
}: {
  title: string;
  hint?: string;
  overlay?: boolean;
}) {
  const body = (
    <div
      role="status"
      aria-live="polite"
      className={
        overlay
          ? "surface-card flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl p-8 text-center"
          : "surface-card flex items-start gap-3 rounded-xl p-4"
      }
    >
      <Loader2 className={`text-accent-purple shrink-0 animate-spin ${overlay ? "size-8" : "mt-0.5 size-4"}`} />
      <div>
        <p className={`text-text-primary font-[600] ${overlay ? "text-lg" : "text-sm"}`}>{title}</p>
        {hint && <p className="text-text-muted mt-1 text-xs leading-relaxed">{hint}</p>}
      </div>
    </div>
  );

  if (!overlay) return body;

  return (
    <div className="bg-bg-base/80 fixed inset-0 z-[100] flex items-center justify-center px-6 backdrop-blur-sm">
      {body}
    </div>
  );
}
