import mongoose, { Schema, Document } from 'mongoose';

// Interface for UserState document
export interface IUserState extends Document {
  chatId: number;
  state: string;
  data?: Record<string, any>;
  lastUpdated: Date;
  expiresAt?: Date;
}

// UserState schema
const userStateSchema: Schema = new Schema({
  chatId: {
    type: Number,
    required: true,
    unique: true,
  },
  state: {
    type: String,
    required: true,
  },
  data: {
    type: Schema.Types.Mixed,
    required: false,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: false,
  },
});

export default mongoose.model<IUserState>('UserState', userStateSchema);