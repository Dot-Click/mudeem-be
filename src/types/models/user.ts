import mongoose, { Document } from 'mongoose';

export interface ISubscription extends Document {
    user: mongoose.Types.ObjectId;
    type: 'sustainbuddy_gpt' | 'content_creator';
    platform: 'google_play' | 'apple_store' | 'revenue_cat';
    status: 'active' | 'cancelled' | 'expired' | 'pending';
    startDate: Date;
    endDate: Date;
    platformSubscriptionId: string;
    receiptData: Record<string, any>;
    autoRenew: boolean;
    lastVerifiedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserSession {
    _id: string;
    session: {
        passport: {
            user: string;
        };
        deviceInfo: Record<string, any>;
        lastActive: Date;
    };
}

export interface IAddress extends Document {
    user: mongoose.Types.ObjectId;
    street: string;
    name: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    zip: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUser extends Document {
    name: string;
    email: string;
    phone: string;
    username: string;
    password: string;
    role: 'user' | 'admin' | 'vendor';
    isActive: boolean;
    emailVerified: boolean;
    adminApproved: boolean;
    allowNotifications: boolean;
    firebaseToken?: string;
    profilePicture?: string;
    emailVerificationToken?: number;
    emailVerificationTokenExpires?: Date;
    passwordResetToken?: number;
    passwordResetTokenExpires?: Date;
    myBooks: mongoose.Types.ObjectId[];
    // greenPoints: {
    //     total: number;
    //     history: Array<{
    //         points: number;
    //         reason: string;
    //         date: Date;
    //     }>;
    // };
    greenPoints: number;
    greenPointsHistory: {
        points: number;
        reason?: string | null;
        type?: string | null;
        date: Date;
    }[];
    subscriptions: {
        sustainbuddyGPT: boolean;
        contentCreator: boolean;
    };
    comparePassword(candidatePassword: string): Promise<boolean>;
    createdAt: Date;
    updatedAt: Date;
}
export interface IEvent extends Document {
    name: string;
    description: string;
    dateTime: Date;
}