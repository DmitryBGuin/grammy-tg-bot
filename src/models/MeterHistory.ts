import mongoose, { Schema, Document } from 'mongoose';

// Интерфейс для документа истории изменения счетчиков
export interface IMeterHistory extends Document {
  apartmentNumber: number;
  meterType: string;
  oldMeterNumber: string;
  newMeterNumber: string;
  changedAt: Date;
  changedBy: string;
  reason?: string;
}

// Схема истории изменения счетчиков
const meterHistorySchema: Schema = new Schema({
  apartmentNumber: {
    type: Number,
    required: true,
  },
  meterType: {
    type: String,
    required: true,
  },
  oldMeterNumber: {
    type: String,
    required: true,
  },
  newMeterNumber: {
    type: String,
    required: true,
  },
  changedAt: {
    type: Date,
    required: true,
  },
  changedBy: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: false,
  },
});

export default mongoose.model<IMeterHistory>('MeterHistory', meterHistorySchema);