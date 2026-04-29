/**
 * Cloudinary Configuration
 * Handles cloud-based image storage
 */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} fileBuffer - The image file buffer
 * @param {object} options - Upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'soosai-hardwares/products',
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(fileBuffer);
  });
};

/**
 * Delete an image from Cloudinary by its public_id
 * @param {string} publicId - The public ID of the image
 * @returns {Promise<object>} Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId);
};

/**
 * Extract public_id from a Cloudinary URL
 * @param {string} url - The Cloudinary image URL
 * @returns {string|null} The public_id or null
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) return null;

  try {
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/folder/filename.ext
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const pathAfterUpload = parts[1];
    // Remove version prefix (v123456789/)
    const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
    // Remove file extension
    return withoutVersion.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};
