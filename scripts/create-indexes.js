const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const explicitEnvPath = path.resolve(__dirname, '../src/config/config.env');
const fallbackEnvPath = path.resolve(__dirname, '../.env');
const resolvedEnvPath = fs.existsSync(explicitEnvPath)
  ? explicitEnvPath
  : fallbackEnvPath;

require('dotenv').config({ path: resolvedEnvPath });

async function main() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  console.log(`Loaded environment from: ${resolvedEnvPath}`);

  const clusterName = uri.split('@')[1] || 'unknown cluster';
  console.log(
    `Connecting to MongoDB: ${clusterName.split('/')[0]}`
  );

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    retryWrites: true,
    retryReads: true
  });

  const poolsCollection = mongoose.connection.collection('pools');

  const indexName = await poolsCollection.createIndex(
    { user: 1 },
    {
      name: 'unique_active_pool_per_user',
      unique: true,
      partialFilterExpression: { rideEnded: false }
    }
  );

  const indexes = await poolsCollection.indexes();

  console.log('Created/verified index:', indexName);
  console.log(
    'Current pool indexes:',
    indexes.map((index) => ({
      name: index.name,
      key: index.key,
      unique: !!index.unique,
      partialFilterExpression: index.partialFilterExpression || null
    }))
  );
}

main()
  .then(async () => {
    await mongoose.disconnect();
    console.log('Done.');
  })
  .catch(async (error) => {
    console.error('Failed to create indexes.');
    console.error(error);

    try {
      await mongoose.disconnect();
    } catch (_disconnectError) {
      // Ignore disconnect errors during failure cleanup.
    }

    process.exit(1);
  });
