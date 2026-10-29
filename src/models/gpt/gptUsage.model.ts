import mongoose from 'mongoose';
import { IGptUsage } from '../../types/models/gpt';

const gptUsageSchema = new mongoose.Schema<IGptUsage>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

gptUsageSchema.index({ user: 1, date: 1 }, { unique: true });

const GptUsage = mongoose.model<IGptUsage>('GptUsage', gptUsageSchema);
export default GptUsage;
