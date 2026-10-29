import { Document, Schema, model } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  location: string;
  contact: string;
  email: string;
  website: string;
  description: string;
  isActive: boolean;
}

export interface IRequest extends Document {
  wasteType: string;
  quantity: number;
  company?: Schema.Types.ObjectId;
  companyName?: string;
  status: string;
  user: Schema.Types.ObjectId;
  description: string;
  address1: string;
  address2: string;
  pickupDateTime: Date;
}
