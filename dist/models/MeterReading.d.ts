import mongoose, { Document } from 'mongoose';
export interface IMeterReading extends Document {
    userId: string;
    coldWater: number;
    hotWater: number;
    readingDate: Date;
    submittedAt: Date;
}
declare const _default: mongoose.Model<IMeterReading, {}, {}, {}, mongoose.Document<unknown, {}, IMeterReading, {}, {}> & IMeterReading & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=MeterReading.d.ts.map