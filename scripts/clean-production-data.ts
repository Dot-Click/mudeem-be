import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';

dotenv.config({ path: path.join(__dirname, '../src/config/config.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mudeemapp_db_user:JahOjLtmOYufR71Z@cluster0.kdn8wgm.mongodb.net/mudeem?retryWrites=true&w=majority';

// Legitimate admin / review accounts to preserve
const KEEP_EMAILS = [
  'admin@gmail.com',
  'r.ajaj@outlook.com',
  'mudeemsustainapp@gmail.com',
  'developerdev180@gmail.com',
  'contact@ah2k.dev'
];

// Test / junk categories to clean out
const JUNK_CATEGORIES = [
  'robot',
  'robot ',
  'Robot',
  'Toys23w',
  'nihao'
];

async function runCleanup() {
  console.log('Connecting to database...');
  console.log('URI host:', MONGO_URI.split('@')[1] || MONGO_URI);

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('mudeem');

  console.log('\n--- 1. Cleaning Users ---');
  const usersCol = db.collection('users');
  const userDeleteResult = await usersCol.deleteMany({
    email: { $nin: KEEP_EMAILS }
  });
  console.log(`- Deleted ${userDeleteResult.deletedCount} dummy/test users.`);
  
  // Reset green points and histories for kept admins
  await usersCol.updateMany(
    { email: { $in: KEEP_EMAILS } },
    { $set: { greenPoints: 0, greenPointsHistory: [] } }
  );
  console.log(`- Reset green points to 0 for preserved admin accounts.`);

  console.log('\n--- 2. Wiping Demo Content Collections ---');
  const collectionsToWipe = [
    'jobs',            // "HIDC", "ssd22sw" etc.
    'posts',           // "hiiiiii", anime pics, etc.
    'comments',
    'reelcomments',
    'reels',
    'products',        // Demo shoes, plates, etc.
    'variants',
    'orders',          // Demo test orders
    'banners',         // Demo banner with avatar placeholder
    'pools',           // Demo carpools
    'events',          // Demo events
    'farms',           // Demo farms
    'projects',        // Demo projects
    'reviews',         // Demo reviews
    'requestwastes',   // Demo waste requests
    'notifications',   // Demo notifications
    'books',           // Demo books
    'addresses',       // Demo addresses
    'greenmaps',       // Demo green map markers
    'companies',       // Demo companies
    'chats',           // Demo chat messages
    'sessions',        // Stale test sessions
    'co2usages'
  ];

  for (const colName of collectionsToWipe) {
    try {
      const col = db.collection(colName);
      const count = await col.countDocuments();
      if (count > 0) {
        const res = await col.deleteMany({});
        console.log(`- ${colName}: deleted ${res.deletedCount} items`);
      } else {
        console.log(`- ${colName}: already empty (0 items)`);
      }
    } catch (err: any) {
      console.warn(`- ${colName}: error during wipe: ${err.message}`);
    }
  }

  console.log('\n--- 3. Cleaning Categories ---');
  const categoriesCol = db.collection('categories');
  const catDeleteResult = await categoriesCol.deleteMany({
    name: { $in: JUNK_CATEGORIES }
  });
  console.log(`- Deleted ${catDeleteResult.deletedCount} junk test categories.`);
  const remainingCats = await categoriesCol.find({}).toArray();
  console.log(`- Remaining clean categories (${remainingCats.length}):`, remainingCats.map(c => c.name));

  console.log('\n--- 4. Preserved Users ---');
  const remainingUsers = await usersCol.find({}).toArray();
  remainingUsers.forEach(u => console.log(`  - ${u.email} (${u.role || 'user'})`));

  console.log('\n========================================');
  console.log('Database successfully cleaned and ready for production!');
  await client.close();
}

runCleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
