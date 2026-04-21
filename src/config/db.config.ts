import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    // Log the cluster name for verification (masking credentials)
    const clusterName = uri.split('@')[1] || 'unknown cluster';
    console.log(`Attempting to connect to MongoDB: ${clusterName.split('/')[0]}`);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
      autoIndex: true,
    });
    console.log('DB connected successfully: ' + mongoose.connection.host);
  } catch (error) {
    console.error('CRITICAL: Database connection failed.');
    console.error('Error details:', error);
    process.exit(1);
  }
};

export default connectDB;
