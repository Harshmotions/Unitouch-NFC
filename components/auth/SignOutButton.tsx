"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

/* Signs out and returns to /login, e.g. so a customer signed in with the
   wrong email can switch to the one they ordered with. (/login itself
   bounces any existing session straight to the studio, so it can't do this.) */
export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" size="md" onClick={signOut} disabled={busy}>
      Sign out
    </Button>
  );
}
