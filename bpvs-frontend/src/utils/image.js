/**
 * Client-side image compression.
 *
 * Downscales an image to a max edge length and re-encodes it as a high-quality
 * JPEG. For typical phone/camera photos this cuts file size dramatically with
 * no visible quality loss (screens rarely need more than ~1920px, and JPEG q≈0.82
 * is perceptually near-lossless for photographs).
 *
 * Fail-safe: if compression errors or doesn't actually shrink the file, the
 * ORIGINAL file is returned unchanged — so we never upload something worse.
 */
const toJpgName = (name) => `${(name || "image").replace(/\.[^.]+$/, "")}.jpg`;

export const compressImage = (
  file,
  { maxDimension = 1920, quality = 0.82, mimeType = "image/jpeg" } = {},
) =>
  new Promise((resolve) => {
    if (!file || !file.type?.startsWith("image/")) {
      resolve(file);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      const longest = Math.max(width, height);
      if (longest > maxDimension) {
        const scale = maxDimension / longest;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          // Keep whichever is smaller — never make the upload bigger.
          if (blob && blob.size < file.size) {
            resolve(new File([blob], toJpgName(file.name), { type: mimeType }));
          } else {
            resolve(file);
          }
        },
        mimeType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fail-safe: upload original
    };

    img.src = url;
  });
