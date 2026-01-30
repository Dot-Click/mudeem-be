/**
 * Run this script to see how emails are stored in the DB and whether a given email finds a user.
 * Usage: npx ts-node scripts/check-email-in-db.ts [email]
 * Example: npx ts-node scripts/check-email-in-db.ts m.anasayub80@gmail.com
 *
 * Requires MONGO_URI in env (e.g. from ./src/config/config.env).
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../src/config/config.env') });

import mongoose from 'mongoose';
import User from '../src/models/user/user.model';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI. Set it in src/config/config.env or env.');
  process.exit(1);
}

const emailArg = process.argv[2]?.trim();

async function main() {
  await mongoose.connect(MONGO_URI!, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000,
  });
  const dbName = mongoose.connection.db?.databaseName ?? '(default "test")';
  console.log('Connected to:', mongoose.connection.host);
  console.log('DB name:', dbName, MONGO_URI!.includes('/' + dbName) ? '' : ' — add database name to MONGO_URI if wrong (e.g. .../mudeem-v1)');
  console.log('');

  // 1) List some users and their raw email values
  const recent = await User.find({}).select('name email createdAt').sort({ createdAt: -1 }).limit(15).lean();
  console.log('--- Recent users (name, email as stored in DB) ---');
  if (recent.length === 0) {
    console.log('No users in collection.');
  } else {
    recent.forEach((u: { name?: string; email?: string; createdAt?: Date }, i: number) => {
      const email = (u as { email?: string }).email ?? '';
      const repr = JSON.stringify(email);
      console.log(`${i + 1}. name: ${(u as { name?: string }).name}, email: ${repr}`);
    });
  }
  console.log('');

  if (emailArg) {
    // 2) Exact match
    const exact = await User.findOne({ email: emailArg }).lean();
    console.log(`--- Lookup: "${emailArg}" ---`);
    console.log('Exact match (email === input):', exact ? 'FOUND' : 'NOT FOUND');
    if (exact) console.log('  _id:', (exact as { _id?: unknown })._id);

    // 3) Case-insensitive (collation)
    const collation = await User.findOne({ email: emailArg })
      .collation({ locale: 'en', strength: 2 })
      .lean();
    console.log('Case-insensitive (collation):', collation ? 'FOUND' : 'NOT FOUND');
    if (collation) console.log('  _id:', (collation as { _id?: unknown })._id);

    // 4) Trimmed input
    const trimmed = emailArg.trim();
    if (trimmed !== emailArg) {
      const trimmedExact = await User.findOne({ email: trimmed }).lean();
      console.log('Trimmed input exact match:', trimmedExact ? 'FOUND' : 'NOT FOUND');
    }
  } else {
    console.log('Tip: pass an email to test lookup: npx ts-node scripts/check-email-in-db.ts <email>');
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
