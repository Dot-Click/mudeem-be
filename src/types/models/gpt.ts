import mongoose, { Document } from 'mongoose';

export interface IChat extends Document {
  user: mongoose.Schema.Types.ObjectId;
  messages: IMessage[];
  thread: string;
}
export interface IMessage extends Document {
  sender: 'user' | 'bot';
  content: string;
}

export interface IGptUsage extends Document {
  user: mongoose.Schema.Types.ObjectId;
  date: string;
  count: number;
}
