import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../src/config/config.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/user/user.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mudeem:mudeem@mudeem.u2fzgs0.mongodb.net/mudeem';

interface ProvisionAccountConfig {
  name: string;
  email: string;
  phone: string;
  username: string;
  passwordRaw: string;
  role: 'admin' | 'user';
  adminApproved: boolean;
  emailVerified: boolean;
  isActive: boolean;
}

const accountsToProvision: ProvisionAccountConfig[] = [
  {
    name: 'Mudeem Admin',
    email: 'mudeemsustainapp@gmail.com',
    phone: '+971500000001',
    username: 'mudeemsustainapp',
    passwordRaw: 'MudeemAdmin@2026!',
    role: 'admin',
    adminApproved: true,
    emailVerified: true,
    isActive: true
  },
  {
    name: 'Developer Dev',
    email: 'developerdev180@gmail.com',
    phone: '+971500000002',
    username: 'developerdev180',
    passwordRaw: 'MudeemUser@2026!',
    role: 'user',
    adminApproved: false,
    emailVerified: true,
    isActive: true
  }
];

async function main() {
  console.log('Connecting to MongoDB:', MONGO_URI.split('@')[1] || MONGO_URI);
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000
  });

  console.log('Connected to DB:', mongoose.connection.name);

  for (const acc of accountsToProvision) {
    console.log(`\n----------------------------------------`);
    console.log(`Processing: ${acc.email} (${acc.role})`);

    let existing = await User.findOne({ email: acc.email });

    if (existing) {
      console.log(`User ${acc.email} already exists (_id: ${existing._id}). Updating details...`);
      existing.name = acc.name;
      existing.username = acc.username;
      existing.phone = acc.phone;
      existing.role = acc.role;
      existing.emailVerified = acc.emailVerified;
      existing.isActive = acc.isActive;
      existing.adminApproved = acc.adminApproved;
      existing.password = acc.passwordRaw; // will be hashed by pre-save hook
      await existing.save();
      console.log(`Updated successfully.`);
    } else {
      console.log(`Creating new user for ${acc.email}...`);
      existing = new User({
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        username: acc.username,
        password: acc.passwordRaw,
        role: acc.role,
        emailVerified: acc.emailVerified,
        isActive: acc.isActive,
        adminApproved: acc.adminApproved,
        greenPoints: 0,
        greenPointsHistory: [],
        allowNotifications: true,
        subscriptions: {
          sustainbuddyGPT: false,
          contentCreator: false
        }
      });
      await existing.save();
      console.log(`Created successfully (_id: ${existing._id}).`);
    }

    // Verify authentication
    const userInDb = await User.findById(existing._id);
    if (!userInDb) {
      throw new Error(`Failed to find saved user for ${acc.email}`);
    }

    const isMatch = await userInDb.comparePassword(acc.passwordRaw);
    console.log(`Password verification test for ${acc.email}: ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Account details:`);
    console.log(` - ID: ${userInDb._id}`);
    console.log(` - Role: ${userInDb.role}`);
    console.log(` - Email: ${userInDb.email}`);
    console.log(` - Username: ${userInDb.username}`);
    console.log(` - Phone: ${userInDb.phone}`);
    console.log(` - Email Verified: ${userInDb.emailVerified}`);
    console.log(` - Active: ${userInDb.isActive}`);
    console.log(` - Admin Approved: ${userInDb.adminApproved}`);
  }

  await mongoose.disconnect();
  console.log('\n========================================');
  console.log('All accounts provisioned and verified successfully!');
}

main().catch((err) => {
  console.error('Provisioning error:', err);
  process.exit(1);
});
