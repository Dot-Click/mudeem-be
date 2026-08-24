import mongoose, { Document } from 'mongoose';

export interface ICo2Usage extends Document {
  user: mongoose.Schema.Types.ObjectId;
  date: string;
  count: number;
}
