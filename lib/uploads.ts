import sharp from "sharp";

/* Longest edge after resize. Bounds both stored file size and the memory/CPU
   cost of processing an attacker-supplied huge image. */
const MAX_DIMENSION = 2000;

type ImageFormat = "jpeg" | "png" | "webp" | "avif";

/* Real file-signature (magic bytes) check — a client-supplied Content-Type
   header or filename extension is trivially spoofed (audit #04). SVG/HTML
   have no matching signature here, so they're rejected by construction
   rather than via an explicit blocklist. */
function detectImageFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";

  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }

  // ISOBMFF: bytes 4-7 are "ftyp", bytes 8-11 are the major brand.
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand === "avif" || brand === "avis") return "avif";
  }

  return null;
}

export class UploadRejected extends Error {}

/* Validates a real image (by magic bytes, not the client-claimed
   Content-Type/filename) and re-encodes it server-side with Sharp — strips
   EXIF/metadata, caps dimensions, and guarantees the stored bytes are an
   actually-decodable raster image rather than e.g. an SVG/HTML file wearing
   a .jpg extension. Auto-rotates from EXIF orientation before that metadata
   is stripped, so re-encoded photos don't come out sideways. */
export async function processImageUpload(file: File): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const format = detectImageFormat(bytes);
  if (!format) {
    throw new UploadRejected("File must be a JPEG, PNG, WebP, or AVIF image.");
  }

  const pipeline = sharp(Buffer.from(arrayBuffer))
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });

  let buffer: Buffer;
  try {
    switch (format) {
      case "jpeg":
        buffer = await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
        break;
      case "png":
        buffer = await pipeline.png({ compressionLevel: 8 }).toBuffer();
        break;
      case "webp":
        buffer = await pipeline.webp({ quality: 85 }).toBuffer();
        break;
      case "avif":
        buffer = await pipeline.avif({ quality: 60 }).toBuffer();
        break;
    }
  } catch {
    throw new UploadRejected("Could not process that image. Please try a different file.");
  }

  return { buffer, contentType: `image/${format}`, ext: format === "jpeg" ? "jpg" : format };
}
