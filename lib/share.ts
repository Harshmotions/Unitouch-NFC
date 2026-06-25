/* Native share sheet where available (mobile browsers), falling back to
   copying the profile URL to the clipboard on desktop. */
export async function shareProfile(fullName: string, username: string) {
  const url = `${window.location.origin}/u/${username}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: `${fullName} — Unitouch`, url });
      return;
    } catch {
      return;
    }
  }

  await navigator.clipboard.writeText(url);
}
