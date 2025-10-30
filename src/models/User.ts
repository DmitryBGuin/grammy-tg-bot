import mongoose, { Schema, Document } from 'mongoose';

// Интерфейс для документа пользователя
export interface IUser extends Document {
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  isRegistered: boolean;
  registrationDate: Date;
  waterMeters?: {
    coldWater: number;
    hotWater: number;
  };
  meterReadings: Array<mongoose.Types.ObjectId>;
}

// Схема пользователя
const userSchema: Schema = new Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: false,
  },
  isRegistered: {
    type: Boolean,
    default: false,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  waterMeters: {
    coldWater: {
      type: Number,
      required: false,
    },
    hotWater: {
      type: Number,
      required: false,
    },
  },
  meterReadings: [{
    type: Schema.Types.ObjectId,
    ref: 'MeterReading',
  }],
});

export default mongoose.model<IUser>('User', userSchema);