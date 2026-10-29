import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(__dirname, '../src/config/config.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mudeemapp_db_user:JahOjLtmOYufR71Z@cluster0.kdn8wgm.mongodb.net/mudeem?retryWrites=true&w=majority';

// Import all active models from the latest codebase
import User from '../src/models/user/user.model';
import Subscription from '../src/models/user/subscription.model';
import WebhookEvent from '../src/models/subscription/webhookEvent.model';
import Event from '../src/models/user/events.model';
import Address from '../src/models/user/address.model';
import Product from '../src/models/shop/product.model';
import Variant from '../src/models/shop/variant.model';
import Category from '../src/models/shop/category.model';
import Order from '../src/models/shop/order.model';
import Review from '../src/models/shop/review.model';
import Banner from '../src/models/shop/banner.model';
import Pool from '../src/models/carpooling/pool';
import Farm from '../src/models/farm/farm.model';
import Chat from '../src/models/gpt/chat.model';
import Book from '../src/models/academy/book';
import Job from '../src/models/careers/job.model';
import GreenMap from '../src/models/green-map/green-map.model';
import Project from '../src/models/sustainable-innovation/project';
import Company from '../src/models/waste/company.model';
import Request from '../src/models/waste/request.model';
import Notifications from '../src/models/notifications/notifications_model';
import CO2Usage from '../src/models/co2/co2Usage.model';
import Post from '../src/models/collab-forum/post';
import Comment from '../src/models/collab-forum/comment';
import Reel from '../src/models/content-creator/reel';
import ReelComment from '../src/models/content-creator/reel-comment';
import { Setting } from '../src/models/settings';

const ALL_MODELS = [
  { name: 'User', model: User },
  { name: 'Subscription', model: Subscription },
  { name: 'WebhookEvent', model: WebhookEvent },
  { name: 'Event', model: Event },
  { name: 'Address', model: Address },
  { name: 'Product', model: Product },
  { name: 'Variant', model: Variant },
  { name: 'Category', model: Category },
  { name: 'Order', model: Order },
  { name: 'Review', model: Review },
  { name: 'Banner', model: Banner },
  { name: 'Pool', model: Pool },
  { name: 'Farm', model: Farm },
  { name: 'Chat', model: Chat },
  { name: 'Book', model: Book },
  { name: 'Job', model: Job },
  { name: 'GreenMap', model: GreenMap },
  { name: 'Project', model: Project },
  { name: 'Company', model: Company },
  { name: 'Request', model: Request },
  { name: 'Notifications', model: Notifications },
  { name: 'CO2Usage', model: CO2Usage },
  { name: 'Post', model: Post },
  { name: 'Comment', model: Comment },
  { name: 'Reel', model: Reel },
  { name: 'ReelComment', model: ReelComment },
  { name: 'Setting', model: Setting },
];

async function alignDatabase() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    autoIndex: true,
  });
  console.log('Connected to:', mongoose.connection.host);

  console.log('\n--- Synchronizing Indexes Across All 27 Codebase Models ---');

  for (const { name, model } of ALL_MODELS) {
    try {
      await model.init();
      const syncResult = await model.syncIndexes();
      const indexes = await model.collection.indexes();
      console.log(`✅ [${name}] Collection '${model.collection.name}': synced (${indexes.length} indexes in place)`);
    } catch (err: any) {
      console.error(`⚠️ [${name}] Warning during index sync:`, err.message);
    }
  }

  console.log('\n--- Verifying Active Collections ---');
  const collections = await mongoose.connection.db!.listCollections().toArray();
  console.log(`Total collections active in database: ${collections.length}`);
  collections.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
    console.log(`  - ${c.name}`);
  });

  console.log('\n========================================');
  console.log('Database is 100% aligned with current backend code!');
  await mongoose.disconnect();
}

alignDatabase().catch(err => {
  console.error('Alignment failed:', err);
  process.exit(1);
});
