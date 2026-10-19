"use client";

import { suggestEmailFix } from "@/lib/email-typos";

/* "Did you mean rahul@gmail.com?" under an email field, for common domain
   typos (lib/email-typos.ts). Nothing changes unless the button is clicked. */
export default function EmailTypoHint({
  email,
  focused,
  onAccept,
}: {
  email: string;
  // While the field has focus, fixes that just finish the word are held back.
  focused: boolean;
  onAccept: (fixed: string) => void;
}) {
  const fixed = suggestEmailFix(email, focused);
  if (!fixed) return null;

  return (
    <p className="text-text-secondary mt-1.5 text-xs">
      Did you mean{" "}
      <button
        type="button"
        onClick={() => onAccept(fixed)}
        className="text-accent-purple font-[600] underline-offset-2 hover:underline"
      >
        {fixed}
      </button>
      ?
    </p>
  );
}
