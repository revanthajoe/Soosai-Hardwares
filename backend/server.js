const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('express-async-errors');

// Configuration
dotenv.config();

// Database connection
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Utilities
const ensureDefaultAdmin = require('./utils/ensureDefaultAdmin');

// Middleware
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
const { helmetConfig, customSecurityHeaders, corsOptions } = require('./middlewares/securityMiddleware');
const { apiLimiter, authLimiter } = require('./middlewares/rateLimitMiddleware');
const { sanitizeInputs } = require('./middlewares/sanitizeMiddleware');
const { csrfProtection, csrfTokenHandler } = require('./middlewares/csrfMiddleware');
const { logger, morganFormat, morganOptions } = require('./config/logger');

// Swagger
const { swaggerSetup } = require('./config/swagger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ========== SECURITY & COMPRESSION ==========
app.use(helmetConfig);
app.use(customSecurityHeaders);
app.use(compression()); // Compress responses

// ========== LOGGING ==========
app.use(morgan(morganFormat, morganOptions));

// ========== CORS & BODY PARSING ==========
const cors = require('cors');
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeInputs);

if (process.env.ENABLE_CSRF === 'true') {
  app.use(csrfProtection);
  app.get('/api/csrf-token', csrfTokenHandler);
}

// ========== STATIC FILES ==========
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== API DOCUMENTATION ==========
swaggerSetup(app);

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// ========== API ROUTES ==========
// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Auth routes (with stricter rate limiting)
app.use('/api/auth', authLimiter, authRoutes);

// Product and category routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);

// ========== ERROR HANDLING ==========
app.use(notFound);
app.use(errorHandler);

// ========== SERVER STARTUP ==========
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('✓ Database connected successfully');

    // Initialize database schema (create tables if not exist)
    const { initSchema } = require('./models');
    await initSchema();
    logger.info('✓ Database schema initialized');

    // Ensure default admin user exists
    await ensureDefaultAdmin();
    logger.info('✓ Default admin user verified');

    // Start server
    app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV}`);
      logger.info(`✓ API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`✓ Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error(`✗ Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
