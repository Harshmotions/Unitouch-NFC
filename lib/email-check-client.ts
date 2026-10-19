/* Browser-side call to /api/email/check. Import-free so client components
   can use it. Resolves to the error message when the server rejects the
   email (throwaway inbox, or a domain that can't receive mail), otherwise
   null; any network or server
   failure also gives null, so this never blocks a customer on its own. */
export async function fetchEmailDomainError(email: string): Promise<string | null> {
  try {
    const res = await fetch("/api/email/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; error?: string };
    return data.ok === false ? (data.error ?? null) : null;
  } catch {
    return null;
  }
}
