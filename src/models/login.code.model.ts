import  { Schema,  Document, Types, model } from "mongoose";
import { randomBytes } from "crypto";
import { User, IUserDocument } from "./user.model";

const loginCode = new Schema({
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '1d' // 1 day
    },
    user: {
        type: Types.ObjectId,
        ref: User,
        required: true
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

export interface ILoginCode {
    createdAt: Date,
    user: IUserDocument,
    application: IUserDocument,
    code: string
}

export interface ILoginCodeDokument extends ILoginCode, Document {}

export const LoginCode = model<ILoginCodeDokument>('LoginCode', loginCode);