import mongoose, { Schema, Document } from 'mongoose';

// Interface for News document
export interface INews extends Document {
  title: string;
  content: string;
  date: Date;
  createdBy: string;
  sent: boolean;
}

// News schema
const newsSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: String,
    required: true,
  },
  sent: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model<INews>('News', newsSchema);