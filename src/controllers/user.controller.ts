import { RestController } from "../interfaces/rest-controller.interface";
import { Router, Request, Response } from "express";
import { User, IUser, UserResponse, IUserDocument } from "../models/user.model";
import { check, validationResult, query, param, body } from "express-validator";
import { hashSync } from "bcryptjs";
import { passwordRegEx } from "../utils/password-regex";
import { validate } from "../utils/validate";
import { createUser } from "../utils/createUser";
import { authenticate, generateDefaultJWT } from "../utils/authenticate";
import { UserServiceRole, role } from "../utils/roles";

export class UserController implements RestController {
    path: string = '/users';

    initializeRoutes(): import("express").Router {
        const router = Router();

        router.get('/', authenticate, role(UserServiceRole.Read).needed, this.getAllUsers);
        router.post('/', authenticate,
            check('name').exists(),
            check('email').isEmail(),
            check('password').isLength({ min: 8 }).matches(passwordRegEx)
            , role(UserServiceRole.Write).needed,
            this.createNewUser);

        router.post('/verify', [query('email').exists().isEmail(), query('token').exists().notEmpty()], this.verifyUserRegistration);

        router.get('/current', authenticate, this.getCurrentUser);
        router.put('/current/password', authenticate, this.updateCurrentUserPassword);
        router.get('/current/roles', authenticate, this.getCurrentUserRoles);

        router.get('/:userId', authenticate, role(UserServiceRole.Read).needed, param('userId').exists(), this.getSpecificUser);
        router.get('/:userId', authenticate, role(UserServiceRole.Write).needed, param('userId').exists(), this.deleteSpecificUser)

        router.get('/:userId/roles', authenticate, role(UserServiceRole.Application).needed, param('userId').exists(), this.getSpecificUserRoles);
        router.post('/:userId/roles', authenticate, role(UserServiceRole.Application).needed, param('userId').exists(), body().isArray(), this.addRoleToSpecificUser);
        router.delete('/:userId/roles/:role', authenticate,
            role(UserServiceRole.Application).needed, param('userId').exists(), param('role').exists(),
            this.deleteRoleFromSpecificUser);

        return router;
    }
    deleteSpecificUser(req: Request, res: Response) {
        if (!validate(req, res)) return;

        User.findByIdAndDelete(req.params.userId, (err, deleted) => {
            if (err) return res.sendStatus(500);

            return res.sendStatus(204);
        })
    }

    deleteRoleFromSpecificUser(req: Request, res: Response) {
        if (!validate(req, res)) {
            return;
        }

        const callingUser: IUserDocument = res.locals.user;

        if (!req.params.role.startsWith(`${callingUser.name}-`) && !callingUser.roles.includes(UserServiceRole.Root))
            return res.status(400).send({ message: `You are only allowed to add/remove roles starting with "${callingUser.name}-".` });

        User.findById(req.params.userId, (err, user) => {
            if (err || !user)
                return res.sendStatus(404);

            for (let index = 0; index < user.roles.length; index++) {
                const element = user.roles[index];

                if (element === req.params.role)
                    user.roles.splice(index, 1);
            }

            user.save((err, product) => {
                return res.sendStatus(204);
            });
        });
    }

    addRoleToSpecificUser(req: Request, res: Response) {
        if (!validate(req, res)) {
            return;
        }

        const roles: string[] = req.body;


        if (!res.locals.user.roles.includes(UserServiceRole.Root)) {
            for (let i = 0; i < roles.length; i++) {
                const role = roles[i];

                if (!role.startsWith(res.locals.user.name))
                    return res.status(400).send({ message: 'You are not allowed to post roles with this name' });
            }
        }

        User.findById(req.params.userId, (err, user) => {
            if (err || !user)
                return res.sendStatus(404);

            roles.forEach(role => {
                if (!user.roles.includes(role))
                    user.roles.push(role);
            });

            user.save((err, result) => {
                return res.sendStatus(201);
            });
        });
    }

    getSpecificUserRoles(req: Request, res: Response): any {
        if (!validate(req, res))
            return;

        const callingUser: IUserDocument = res.locals.user;

        User.findById(req.params.userId, (err, user) => {
            if (err || !user)
                return res.sendStatus(404);

            const visibleRoles: string[] = [];

            user.roles.forEach(role => {
                if (role.startsWith(`${callingUser.name}-`) || callingUser.roles.includes(UserServiceRole.Root))
                    visibleRoles.push(role);
            });

            res.send(visibleRoles);
        });
    }

    getCurrentUserRoles(req: Request, res: Response): any {
        const user: IUserDocument = res.locals.user;

        if (!user) {
            return res.sendStatus(404);
        }

        res.send(user.roles);
    }

    updateCurrentUserPassword(req: Request, res: Response) {
        const user: IUserDocument = res.locals.user;

        if (!user) {
            return res.sendStatus(404);
        }

        user.password = hashSync(req.body.password, 10)
        user.passwordLastModified = new Date();

        user.save((err, _product) => {
            if (err) {
                return res.sendStatus(500)
            }

            return res.header('authorization', generateDefaultJWT(user)).sendStatus(204);
        });
    }

    getCurrentUser(_req: Request, res: Response) {
        res.send(new UserResponse(res.locals.user));
    }

    getAllUsers(_req: Request, res: Response): any {
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

        createUser(user, (err, userDoc) => {
            // 11000 = Duplicate key error
            if (err && err.code === 11000) {
                return res.status(409).send('User already exists');
            }

            if (!userDoc || err) {
                console.error(err);
                return res.status(500).send();
            }

            res.status(201).header("location", userDoc._id).send({ message: `A verification Mail was sent to ${userDoc.email}.` });
        });
    }

    verifyUserRegistration(req: Request, res: Response): any {
        if (!validate(req, res))
            return;

        User.findOne({ email: req.query.email }, (err, user) => {
            if (err || !user)
                return res.sendStatus(404);

            if (user.emailVerificationToken !== req.query.token)
                return res.status(400).send({ message: 'Wrong Token' });

            User.findByIdAndUpdate(user._id, { $unset: { emailVerificationToken: 1 }, emailVerified: true }, (err) => {
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

    setUserPassword(req: Request, res: Response): any {
    }
}