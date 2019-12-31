import { Schema, model, Document } from "mongoose";
import { sign } from "jsonwebtoken";
import { passwordRegEx } from "../utils/password-regex";
import { randomBytes } from "crypto";

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
    emailVerificationToken: {
        type: String,
        default: randomBytes(32).toString('hex')
    }
});

userSchema.methods.getJwt = function() {
    return sign({email: this.email}, "123456", {expiresIn: "1 day"});
}

export class UserResponse {
    id: string;
    name: string;
    email: string;

    constructor(doc: IUserDocument) {
        this.id = doc._id;
        this.name = doc.name;
        this.email = doc.email;
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
}

export interface IUserDocument extends IUser, Document {

}

export const User = model<IUserDocument>("User", userSchema);