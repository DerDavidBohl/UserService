import { Schema, model, Document } from "mongoose";
import { sign } from "jsonwebtoken";
import { passwordRegEx } from "../utils/password-regex";
import { randomBytes } from "crypto";
import { Token } from "nodemailer/lib/xoauth2";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    emailVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    roles: {
        type: [String],
        lowercase: true,
        default: [],
        required: true
    },
    passwordResetToken: String,
    passwordResetTokenRequestDate: Date,
    passwordLastModified: {
        type: Date,
        default: new Date()
    },
    emailVerificationToken: {
        type: String,
        default: function() {return randomBytes(32).toString('hex')}
    }
});

export class UserResponse {
    id: string;
    name: string;
    email: string;
    passwordLastModified: string;

    constructor(doc: IUserDocument) {
        this.id = doc._id;
        this.name = doc.name;
        this.email = doc.email;
        this.passwordLastModified = doc.passwordLastModified.toString();
    }

    static getMultiple(docs: IUserDocument[]) {
        const users: UserResponse[] = [];

        docs.forEach(doc => users.push(new UserResponse(doc)));

        return users;
    }
}

export interface IUser {
    name: string,
    email: string,
    password:string,
    emailVerified: boolean,
    emailVerificationToken: String,
    roles: string[],
    passwordResetToken: string,
    passwordResetTokenRequestDate: Date
    passwordLastModified: Date
}

export interface IUserDocument extends IUser, Document {}

export interface IJsonWebToken {
    user: UserResponse;
    type: TokenType;
}

export interface JsonWebToken {
    payload: any;
}

export class UserJsonWebTokenPayload implements IJsonWebToken {
    type = TokenType.User;
    constructor(public user: UserResponse){}
}

export class ApplicationJsonWebTokenPayload implements IJsonWebToken {
    type = TokenType.Application;
    constructor(public user: UserResponse, public application: UserResponse){};
}

export const User = model<IUserDocument>("User", userSchema);

export enum TokenType {
    User,
    Application
}