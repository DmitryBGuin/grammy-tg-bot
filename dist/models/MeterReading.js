import mongoose, { Schema } from 'mongoose';
// Схема показаний счетчиков
const meterReadingSchema = new Schema({
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
export default mongoose.model('MeterReading', meterReadingSchema);
//# sourceMappingURL=MeterReading.js.map