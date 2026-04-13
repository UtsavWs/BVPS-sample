const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract the Cloudinary public_id from a secure URL.
 * e.g. https://res.cloudinary.com/demo/image/upload/v1234/bpvs/profiles/abc.jpg
 *      → "bpvs/profiles/abc"
 */
const extractPublicId = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  const parts = url.split("/upload/");
  if (parts.length < 2) return null;
  let publicId = parts[1];
  // Remove version prefix (e.g. v1234567890/)
  publicId = publicId.replace(/^v\d+\//, "");
  // Remove file extension
  publicId = publicId.replace(/\.[^/.]+$/, "");
  return publicId;
};

/**
 * Delete an image from Cloudinary by its URL.
 * Returns true on success, false if skipped/failed.
 */
const deleteCloudinaryImage = async (imageUrl) => {
  const isConfigured =
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== "your_api_key_here" &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== "your_api_secret_here";

  if (!isConfigured) {
    console.warn(
      "[Cloudinary] API credentials not configured — skipping deletion.",
    );
    return false;
  }

  const publicId = extractPublicId(imageUrl);
  if (!publicId) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] Deleted "${publicId}":`, result.result);
    return result.result === "ok";
  } catch (err) {
    console.error(`[Cloudinary] Failed to delete "${publicId}":`, err.message);
    return false;
  }
};

module.exports = { deleteCloudinaryImage };
