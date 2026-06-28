/* Customers often type a bare domain ("motionbyharsh.com") into a link
   field instead of a full URL. Used directly as an <a href>, that resolves
   as a relative path on our own domain instead of opening the external
   site — this guarantees every link is absolute. */
export function withProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
