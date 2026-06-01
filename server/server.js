require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { STORAGE_MODE } = require('./middleware/uploadMiddleware');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
    console.log(`[upload] Image storage backend: ${STORAGE_MODE}${STORAGE_MODE === 'disk' ? ' (set CLOUDINARY_* env vars to use Cloudinary)' : ''}`);
  });

  const shutdown = (signal) => {
    console.log(`\n[server] ${signal} received. Closing gracefully...`);
    server.close(() => {
      console.log('[server] HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled Rejection:', reason);
  });
};

start();
