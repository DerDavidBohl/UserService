import { RestController } from "../interfaces/rest-controller.interface";
import { Router, Request, Response } from "express";
import { User, IUser, IUserDocument, UserResponse } from "../models/user.model";
import { check, validationResult, param, ValidationChain, query } from "express-validator";
import { sign } from "jsonwebtoken";
import { hashSync } from "bcryptjs";
import { passwordRegEx } from "../utils/password-regex";
import { mailer, fromEmail } from "../utils/send-mail";
import { validate } from "../utils/validate";

export class UserController implements RestController {
    path: string = '/users';

    initializeRoutes(): import("express").Router {
        const router = Router();

        router.get('/', this.getAllUsers);
        router.post('/', [
            check('name').exists(),
            check('email').isEmail(),
            check('password').isLength({ min: 8 }).matches(passwordRegEx),
            check('roles').isArray()
        ], this.createNewUser);
        router.post('/verify', [query('email').exists().isEmail(), query('token').exists().notEmpty()], this.verifyUser)

        return router;
    }

    verifyUser(req: Request, res: Response): any {
        if (!validate(req, res))
            return;

        User.findOne({ email: req.query.email }, (err, user) => {
            if (err || !user)
                return res.sendStatus(404);

            if (user.emailVerificationToken !== req.query.token)
                return res.status(400).send({ message: 'Wrong Token' });
            
            User.findByIdAndUpdate(user._id, {$unset: {emailVerificationToken: 1}, emailVerified: true}, (err, updated) => {
                if (err)
                    return res.sendStatus(500);;

                res.sendStatus(204);
            });
        });
    }

    getSpecificUser(req: Request, res: Response): any {
        User.findById(req.params.userId, (err, user) => {
            if (err || !user)
                return res.sendStatus(404);

            res.status(200).send(<UserResponse>user)
        });
    }

    getAllUsers(req: Request, res: Response): any {
        User.find((err, users) => {
            if (err)
                return res.sendStatus(500);

            res.status(200).send(UserResponse.getMultiple(users));
        });
    }

    createNewUser(req: Request, res: Response) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() })
        }

        const user = <IUser>req.body;

        user.email = user.email.toLowerCase();
        user.password = hashSync(user.password, 10);

        User.create(user, (err: any, user: IUserDocument) => {

            // Duplicate key error
            if (err && err.code === 11000) {
                return res.status(409).send('User already exists');
            }

            if (err) {
                console.error(err);
                return res.status(500).send();
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
            }, (err, info) => {
                if (err) {
                    console.error(err);

                    return res.sendStatus(500);
                }
                res.status(201).header("location", user._id).send({ message: `A verification Mail was sent to ${user.email}.` });
            });
        });
    }
}