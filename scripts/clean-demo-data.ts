import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../src/config/config.env') });

import mongoose from 'mongoose';

const KEEP_EMAILS = [
  'mudeemsustainapp@gmail.com',
  'developerdev180@gmail.com'
];

async function cleanDatabase(dbUri: string, dbLabel: string) {
  console.log(`\n========================================`);
  console.log(`Cleaning database: ${dbLabel}`);
  console.log(`URI: ${dbUri.split('@')[1] || dbUri}`);

  const conn = await mongoose.createConnection(dbUri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000
  }).asPromise();

  const db = conn.db;

  // 1. Clean users collection (keep ONLY the 2 requested accounts)
  const usersCol = db.collection('users');
  const userDeleteResult = await usersCol.deleteMany({
    email: { $nin: KEEP_EMAILS }
  });
  console.log(`- users: deleted ${userDeleteResult.deletedCount} demo users (kept ${KEEP_EMAILS.join(', ')})`);

  // Ensure retained users have zeroed demo points
  await usersCol.updateMany(
    { email: { $in: KEEP_EMAILS } },
    { $set: { greenPoints: 0, greenPointsHistory: [] } }
  );

  // Collections to wipe completely (all demo content)
  const collectionsToWipe = [
    'orders',
    'variants',
    'products',
    'pools',
    'posts',
    'comments',
    'reelcomments',
    'reels',
    'projects',
    'reviews',
    'requestwastes',
    'notifications',
    'events',
    'farms',
    'books',
    'addresses',
    'greenmaps',
    'companies',
    'chats',
    'sessions',
    'jobs',
    'banners',
    'co2usages',
    'subscriptions'
  ];

  for (const colName of collectionsToWipe) {
    try {
      const col = db.collection(colName);
      const count = await col.countDocuments();
      if (count > 0) {
        const res = await col.deleteMany({});
        console.log(`- ${colName}: deleted ${res.deletedCount} documents`);
      } else {
        console.log(`- ${colName}: already empty (0 documents)`);
      }
    } catch (e: any) {
      console.warn(`- ${colName}: error during wipe (${e.message})`);
    }
  }

  // Summary check
  const remainingUsers = await usersCol.find().toArray();
  console.log(`\nRemaining users in ${dbLabel}: ${remainingUsers.length}`);
  remainingUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));

  await conn.close();
}

async function main() {
  const prodUri = process.env.MONGO_URI || 'mongodb+srv://mudeem:mudeem@mudeem.u2fzgs0.mongodb.net/mudeem';
  const demoUri = 'mongodb+srv://developer:LSmx7SE9SoBCHHAS@cluster0.g8fq8.mongodb.net/mudeem-v1';

  await cleanDatabase(prodUri, 'Production (mudeem)');
  await cleanDatabase(demoUri, 'Demo/Dev (mudeem-v1)');

  console.log(`\n========================================`);
  console.log('Database cleanup completed successfully!');
}

main().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
