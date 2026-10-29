import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.join(__dirname, '../src/config/config.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mudeemapp_db_user:JahOjLtmOYufR71Z@cluster0.kdn8wgm.mongodb.net/mudeem?retryWrites=true&w=majority';

async function provisionAppleReviewer() {
  console.log('Connecting to database...');
  console.log('URI host:', MONGO_URI.split('@')[1] || MONGO_URI);

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('mudeem');
  const usersCol = db.collection('users');

  const email = 'r.ajaj@outlook.com';
  const plainPassword = 'MudeemUser@2026!';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const reviewerUserData = {
    name: 'Rahaf Ajaj',
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    phone: '+971500000000',
    username: 'r.ajaj',
    role: 'user',
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpires: null,
    passwordResetToken: null,
    passwordResetTokenExpires: null,
    isActive: true,
    adminApproved: true,
    allowNotifications: true,
    greenPoints: 50,
    greenPointsHistory: [
      {
        points: 50,
        reason: 'Welcome bonus',
        type: 'credit',
        date: new Date()
      }
    ],
    subscriptions: {
      sustainbuddyGPT: true,
      contentCreator: true
    },
    updatedAt: new Date()
  };

  const existing = await usersCol.findOne({ email });

  if (existing) {
    console.log(`User ${email} already exists. Updating credentials and review access...`);
    await usersCol.updateOne(
      { email },
      {
        $set: {
          ...reviewerUserData
        }
      }
    );
    console.log(`User ${email} updated successfully.`);
  } else {
    console.log(`User ${email} not found. Creating new Apple review account...`);
    await usersCol.insertOne({
      ...reviewerUserData,
      createdAt: new Date()
    });
    console.log(`User ${email} created successfully.`);
  }

  // Verification step: test bcrypt compare
  const verifiedUser = await usersCol.findOne({ email });
  const isMatch = await bcrypt.compare(plainPassword, verifiedUser?.password || '');
  console.log('\n--- Credentials Verification ---');
  console.log(`Email: ${verifiedUser?.email}`);
  console.log(`Password Match Test: ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`emailVerified: ${verifiedUser?.emailVerified}`);
  console.log(`isActive: ${verifiedUser?.isActive}`);
  console.log(`Subscriptions:`, verifiedUser?.subscriptions);

  await client.close();
}

provisionAppleReviewer().catch(err => {
  console.error('Failed to provision user:', err);
  process.exit(1);
});
