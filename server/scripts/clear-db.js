require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function clearDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[clear-db] MONGO_URI is not set');
    process.exit(1);
  }

  console.log('[clear-db] Connecting to MongoDB...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[clear-db] Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  const collections = await mongoose.connection.db.listCollections().toArray();
  if (collections.length === 0) {
    console.log('[clear-db] No collections to drop.');
  } else {
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
      console.log(`[clear-db] Dropped collection: ${col.name}`);
    }
    console.log(`[clear-db] Cleared ${collections.length} collection(s).`);
  }

  await mongoose.disconnect();
  console.log('[clear-db] Done.');
  process.exit(0);
}

clearDB().catch((err) => {
  console.error('[clear-db] Error:', err.message);
  process.exit(1);
});
