import qrcode from "qrcode-generator";

/* A QR code as a square grid of dark (true) and light (false) modules.
   Medium error correction, smallest size that fits. Import-free apart from
   the tiny generator, so the 3D card and the card preview can share it. */
export function qrModules(text: string): boolean[][] {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}
