import { RestController } from "../interfaces/rest-controller.interface";
import { Router, Request, Response } from "express";
import { body, query } from "express-validator";
import { User } from "../models/user.model";
import { randomBytes } from "crypto";
import { mailer, fromEmail } from "../utils/send-mail";
import { passwordRegEx } from "../utils/password-regex";
import { validate } from "../utils/validate";
import { hashSync } from "bcryptjs";

export class ResetController implements RestController {

    path: string = '/reset';

    initializeRoutes(): Router {
        const router = Router();

        router.post('/', query('email').exists().isEmail(), query('token').exists(), body('password').exists().matches(passwordRegEx), this.resetPassword);
        router.post('/request', body('email').exists().isEmail(), this.requestPasswordReset);

        return router;
    }

    resetPassword(req: Request, res: Response) {

        if (!validate(req, res)) {
            return;
        }

        User.findOne({ email: req.query.email }, (err, user) => {

            if (err || !user) {
                return res.status(404).send({ message: 'User not found' });
            }

            if (user.passwordResetToken !== req.query.token) {
                return res.status(400).send({ message: 'Wrong Token' });
            }

            // Detect if RequestDate is younger than 1 day
            const todayMinus1Day = new Date();
            todayMinus1Day.setDate(todayMinus1Day.getDate() - 1);

            if (user.passwordResetTokenRequestDate < todayMinus1Day) {
                return res.status(400).send({ message: 'Wrong Token' });
            }

            User.updateOne({ _id: user._id },
                { $unset: { passwordResetToken: 1, passwordResetTokenRequestDate: 1 }, password: hashSync(req.body.password, 10), passwordLastModified: Date.now() },
                (err) => {
                    if (err)
                        return res.sendStatus(500);

                    res.status(204).send({ message: 'Password changed' });
                });
        });
    }

    requestPasswordReset(req: Request, res: Response): any {
        if (!validate(req, res)) {
            return;
        }

        res.sendStatus(204);
        User.findOne({ email: (<string>req.body.email).toLowerCase() }, (err, user) => {
            if (err || !user)
                return;

            user.passwordResetToken = randomBytes(32).toString('hex');
            user.passwordResetTokenRequestDate = new Date();

            console.log(process.env.MAIL_DISPLAY_NAME);


            user.save((err, user) => {
                mailer.sendMail({
                    subject: 'Password Reset',
                    text:
                        `Hello ${user.name},\n
a password reset was requested. 
If you have not requested a password reset, ignore this E-Mail.
You can set a new password here:
${process.env.RESET_TOKEN_PRE_URL}?email=${user.email}&token=${user.passwordResetToken}
This link is valid for 1 day.

Have a nice day!`,
                    to: user.email,
                    from: fromEmail
                }, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    console.log(`A PasswordResetToken was successfully sent to ${user.email}`);

                });
            });
        });
    }
}