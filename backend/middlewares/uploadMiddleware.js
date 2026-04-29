/**
 * Upload Middleware
 * Uses multer with memory storage (buffer) + Cloudinary for cloud image storage
 */

const multer = require('multer');
const { uploadToCloudinary } = require('../config/cloudinary');

const maxFileSize = Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024);
const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,webp')
  .split(',')
  .map((type) => type.trim().toLowerCase())
  .filter(Boolean)
  .map((type) => `image/${type}`);

// Use memory storage - files are kept in buffer, not written to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WEBP images are allowed.'));
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter,
});

/**
 * Middleware to upload the multer buffer to Cloudinary
 * Must be used AFTER multer middleware
 * Attaches `req.cloudinaryUrl` with the uploaded image URL
 */
const uploadToCloud = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'soosai-hardwares/products',
    });

    req.cloudinaryUrl = result.secure_url;
    req.cloudinaryPublicId = result.public_id;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = upload;
module.exports.uploadToCloud = uploadToCloud;
