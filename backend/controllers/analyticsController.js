const { Analytics } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const getAnalytics = asyncHandler(async (req, res) => {
  const stats = await Analytics.getStats();
  res.status(200).json({ success: true, data: stats });
});

const incrementVisit = asyncHandler(async (req, res) => {
  await Analytics.increment('visits');
  res.status(200).json({ success: true });
});

const incrementOrder = asyncHandler(async (req, res) => {
  await Analytics.increment('whatsapp_orders');
  res.status(200).json({ success: true });
});

module.exports = {
  getAnalytics,
  incrementVisit,
  incrementOrder,
};
