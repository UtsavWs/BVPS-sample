const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// resourceType: "image" for photos, "auto"/"raw" for documents (pdf/excel/word).
const endpoint = (resourceType = 'image') =>
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

export const uploadToCloudinary = async (file, options = {}) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary environment variables are not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  // Optional transformations
  if (options.folder) {
    formData.append('folder', options.folder);
  }

  const res = await fetch(endpoint(options.resourceType), {
    method: 'POST',
    body: formData,
    signal: options.signal,
  });

  if (!res.ok) {
    throw new Error('Failed to upload file to Cloudinary');
  }

  const data = await res.json();
  return data.secure_url;
};

/**
 * Upload a non-image document (pdf, excel, word, …) using Cloudinary's
 * "auto" resource type so it stores the raw file. Returns the secure URL.
 */
export const uploadDocumentToCloudinary = (file, options = {}) =>
  uploadToCloudinary(file, { ...options, resourceType: 'auto' });

export const getOptimizedUrl = (url, { width, height, crop = 'fill', gravity = 'face' } = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url;

  // Insert transformation parameters into the Cloudinary URL
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transformations = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity && crop === 'fill') transformations.push(`g_${gravity}`);

  if (transformations.length === 0) return url;

  return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
};
