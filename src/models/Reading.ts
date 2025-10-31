import mongoose, { Schema, Document } from 'mongoose';

// Интерфейс для документа показаний счетчиков
export interface IReading extends Document {
  apartmentNumber: number;
  chatId: number;
  date: Date;
  cold: number;
  hot: number;
  verified: boolean;
  verifiedBy?: string;
  originalMessage?: string;
  source?: string;
  createdAt?: Date;
  archivedAt?: Date;
}

// Схема показаний счетчиков
const readingSchema: Schema = new Schema({
  apartmentNumber: {
    type: Number,
    required: true,
  },
  chatId: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  cold: {
    type: Number,
    required: true,
    min: 0,
  },
  hot: {
    type: Number,
    required: true,
    min: 0,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: String,
    required: false,
  },
  originalMessage: {
    type: String,
    required: false,
  },
  source: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  archivedAt: {
    type: Date,
    required: false,
  },
});

export default mongoose.model<IReading>('Reading', readingSchema);