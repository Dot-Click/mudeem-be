import mongoose from 'mongoose';
import { ICo2Usage } from '../../types/models/co2';

const co2UsageSchema = new mongoose.Schema<ICo2Usage>(
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

co2UsageSchema.index({ user: 1, date: 1 }, { unique: true });

const Co2Usage = mongoose.model<ICo2Usage>('Co2Usage', co2UsageSchema);
export default Co2Usage;
