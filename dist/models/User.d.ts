import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map