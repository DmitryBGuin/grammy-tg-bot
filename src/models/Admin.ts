import mongoose, { Schema, Document } from 'mongoose';

// Interface for Admin document
export interface IAdmin extends Document {
  chatId: number;
  username: string;
  addedAt: Date;
}

// Admin schema
const adminSchema: Schema = new Schema({
  chatId: {
    type: Number,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IAdmin>('Admin', adminSchema);