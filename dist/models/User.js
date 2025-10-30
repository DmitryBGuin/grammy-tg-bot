import mongoose, { Schema } from 'mongoose';
// Схема пользователя
const userSchema = new Schema({
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
export default mongoose.model('User', userSchema);
//# sourceMappingURL=User.js.map