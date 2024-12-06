import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  qrCode: string;
  category: string;
  inventory: number;
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  _id: mongoose.Types.ObjectId;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  inventory: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  customFields: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
productSchema.index({ name: 1, category: 1 });
productSchema.index({ qrCode: 1 });

// Pre-save middleware to ensure qrCode is unique if provided
productSchema.pre('save', async function(next) {
  if (this.isModified('qrCode') && this.qrCode) {
    const ProductModel = mongoose.model<IProduct>('Product');
    const exists = await ProductModel.findOne({ qrCode: this.qrCode });
    if (exists && !exists._id.equals(this._id)) {
      next(new Error('QR Code must be unique'));
    }
  }
  next();
});

export default mongoose.model<IProduct>('Product', productSchema); 