import mongoose from 'mongoose';
import { IPool } from '../../types/models/carpooling';

const poolSchema = new mongoose.Schema<IPool>(
  {
    pickupLocation: {
      type: String,
      required: true
    },
    whereTo: {
      type: String,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    availableSeats: {
      type: Number,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rideEnded: {
      type: Boolean,
      default: false
    },
    rideStarted: {
      type: Boolean,
      default: false
    },
    existingUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',

      }
    ],
    droppedOffUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

poolSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: { rideEnded: false }
  }
);

const Pool = mongoose.model<IPool>('Pool', poolSchema);
export default Pool;
