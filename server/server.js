require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');
const { STORAGE_MODE } = require('./middleware/uploadMiddleware');

const PORT = process.env.PORT || 5000;

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed');
    return;
  }

  const normalizedEmail = String(adminEmail).toLowerCase().trim();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    console.log(`[seed] Admin already exists: ${normalizedEmail}`);
    return;
  }

  await User.create({
    name: 'Admin',
    email: normalizedEmail,
    password: adminPassword,
    role: 'admin',
  });
  console.log(`[seed] Admin user created: ${normalizedEmail}`);
}

const start = async () => {
  await connectDB();
  await seedAdmin();

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
