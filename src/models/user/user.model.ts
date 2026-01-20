import mongoose, { Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { IUser } from '../../types/models/user';

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid Email');
        }
      }
    },
    password: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true,
      unique: true
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'vendor'],
      default: 'user'
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: Number,
      default: null
    },
    emailVerificationTokenExpires: {
      type: Date,
      default: null
    },
    passwordResetToken: {
      type: Number,
      default: null
    },
    passwordResetTokenExpires: {
      type: Date,
      default: null
    },
    firebaseToken: {
      type: String,
      default: null,
    },
    greenPoints: {
      type: Number,
      default: 0
    },
    greenPointsHistory: [{
      points: { type: Number, required: true },
      reason: { type: String },
      type: { type: String },
      date: { type: Date, default: Date.now }
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    adminApproved: {
      type: Boolean,
      default: false
    },
    myBooks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
      }
    ],
    profilePicture: {
      type: String
    },
    allowNotifications: {
      type: Boolean,
      default: true,
      required: false
    },
    subscriptions: {
      sustainbuddyGPT: {
        type: Boolean,
        default: false
      },
      contentCreator: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
