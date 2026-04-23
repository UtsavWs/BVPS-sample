const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

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

  const res = await fetch(CLOUDINARY_URL, {
    method: 'POST',
    body: formData,
    signal: options.signal,
  });

  if (!res.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await res.json();
  return data.secure_url;
};

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
