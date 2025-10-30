import mongoose, { Schema, Document } from 'mongoose';

// Интерфейс для документа показаний счетчиков
export interface IMeterReading extends Document {
  userId: string;
  coldWater: number;
  hotWater: number;
  readingDate: Date;
  submittedAt: Date;
}

// Схема показаний счетчиков
const meterReadingSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coldWater: {
    type: Number,
    required: true,
    min: 0,
  },
  hotWater: {
    type: Number,
    required: true,
    min: 0,
  },
  readingDate: {
    type: Date,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IMeterReading>('MeterReading', meterReadingSchema);