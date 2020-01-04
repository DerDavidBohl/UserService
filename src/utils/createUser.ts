import { IUser, IUserDocument, User } from "../models/user.model";

import { hashSync } from "bcryptjs";

import { mailer, fromEmail } from "./send-mail";

export function createUser(user: IUser, callback: (err: any, userDoc?: IUserDocument) => void) {

    user.email = user.email.toLowerCase();
    user.password = hashSync(user.password, 10);

    User.create(user, (err: any, user: IUserDocument) => {

        if (err) {
            callback(err);
        }

        mailer.sendMail({
            to: user.email,
            from: fromEmail,
            subject: 'Welcome',
            text: `Hello ${user.name},

we're happy to welcome you as new user!
Please verify your E-Mail here:
${process.env.VERIFY_TOKEN_PRE_URL}?email=${user.email}&token=${user.emailVerificationToken}

Thank you!`
        }, (err) => {
            if (err)
                callback(err);

            callback(null, user);
        });
    });
}