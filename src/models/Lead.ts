import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  status: 'New' | 'InProgress' | 'Converted';
  source: string;
  createdAt: Date;
  lastUpdated: Date;
}

const leadSchema = new Schema<ILead>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['New', 'InProgress', 'Converted'],
    default: 'New'
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'lastUpdated' }
});

export default mongoose.model<ILead>('Lead', leadSchema); 