const express = require('express');
const { getAnalytics, incrementVisit, incrementOrder } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getAnalytics);
router.post('/visit', incrementVisit);
router.post('/order', incrementOrder);

module.exports = router;
