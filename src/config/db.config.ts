import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
    });
    console.log('DB connected: ' + mongoose.connection.host);
  } catch (error) {
    console.log('Error connecting database: ' + error);
    process.exit(1);
  }
};

export default connectDB;
