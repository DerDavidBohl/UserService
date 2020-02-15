import  { Schema,  Document, Types, model } from "mongoose";
import { randomBytes } from "crypto";
import { User, IUser, IUserDocument } from "./user.model";

const appTokenCode = new Schema({
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '1d' // 1 day
    },
    application: {
        type: Types.ObjectId,
        ref: User,
        required: true
    },
    code: {
        type: String,
        default: function() {return randomBytes(32).toString('hex')},
        unique: true
    }
});

export interface IAppTokenCode {
    createdAt: Date,
    application: IUserDocument,
    code: string
}

export interface IAppTokenCodeDokument extends IAppTokenCode, Document {}

export const AppTokenCode = model<IAppTokenCodeDokument>('AppTokenCode', appTokenCode);