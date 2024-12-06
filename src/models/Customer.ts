import mongoose, { Document, Schema } from 'mongoose';

interface IAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface INote {
  content: string;
  createdAt: Date;
  createdBy?: string;
}

export interface ICustomer extends Document {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  address: IAddress;
  notes: INote[];
  registrationDate: Date;
}

const addressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String, required: true }
});

const noteSchema = new Schema<INote>({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }
});

const customerSchema = new Schema<ICustomer>({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: addressSchema,
    required: true
  },
  notes: [noteSchema],
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model<ICustomer>('Customer', customerSchema); 