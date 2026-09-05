/**
 * Upload Middleware
 * Uses multer with memory storage (buffer) + Cloudinary for cloud image storage
 */

const multer = require('multer');
const { uploadToCloudinary } = require('../config/cloudinary');

const maxFileSize = Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024);
const maxAdImageFileSize = Number(process.env.MAX_AD_IMAGE_FILE_SIZE || 15 * 1024 * 1024);
const maxVideoFileSize = Number(process.env.MAX_VIDEO_FILE_SIZE || 100 * 1024 * 1024);

const VIDEO_TYPES = ['video/mp4', 'video/webm'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed.'));
  }

  return cb(null, true);
};

const adFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/') && !VIDEO_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only image, GIF, or MP4/WebM video files are allowed.'));
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

// multer only supports a single fileSize ceiling per instance, so we set it to
// the larger (video) limit here and enforce the smaller image/gif limit
// manually in uploadAdToCloud, where the file's mimetype is known.
const uploadAdMedia = multer({
  storage,
  limits: {
    fileSize: maxVideoFileSize,
  },
  fileFilter: adFileFilter,
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

/**
 * Same as uploadToCloud, but for ad media (image/gif/video) using
 * resource_type: 'auto' so Cloudinary handles video/gif correctly.
 */
const uploadAdToCloud = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const isVideo = VIDEO_TYPES.includes(req.file.mimetype);
    const perTypeLimit = isVideo ? maxVideoFileSize : maxAdImageFileSize;
    if (req.file.size > perTypeLimit) {
      return res.status(400).json({
        success: false,
        message: `File too large. Max allowed is ${Math.round(perTypeLimit / (1024 * 1024))}MB for ${isVideo ? 'video' : 'image/GIF'} ads.`,
        statusCode: 400,
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'soosai-hardwares/ads',
      resource_type: 'auto',
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
module.exports.uploadAdMedia = uploadAdMedia;
module.exports.uploadAdToCloud = uploadAdToCloud;
