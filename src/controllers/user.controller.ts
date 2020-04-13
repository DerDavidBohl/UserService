import { RestController } from "../interfaces/rest-controller.interface";
import { Router, Request, Response } from "express";
import { User, IUser, UserResponse, IUserDocument } from "../models/user.model";
import { check, validationResult, query, param, body } from "express-validator";
import { hashSync } from "bcryptjs";
import { passwordRegEx } from "../utils/password-regex";
import { validateParameters } from "../utils/validate";
import { createUser } from "../utils/createUser";
import { authenticate, generateUserToken } from "../utils/authenticate";
import { UserServiceRole, role } from "../utils/roles";
import { deleteRoleFromUser, addRoleToUser, getRolesForUser } from "../utils/user.management";
import { onlyContext } from "../utils/ContextValidation";
import { TokenType } from "../models/tokens";

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
        router.put('/current/password', authenticate, onlyContext(TokenType.User).allowed, body('password').isLength({ min: 8 }).matches(passwordRegEx), this.updateCurrentUserPassword);
        router.get('/current/roles', authenticate,  this.getCurrentUserRoles);

        router.get('/:userId', authenticate, param('userId').exists(), this.getSpecificUser);
        router.delete('/:userId', authenticate, role(UserServiceRole.Write).needed, param('userId').exists(), this.deleteSpecificUser)

        router.get('/:userId/roles', authenticate, role(UserServiceRole.Application).needed, param('userId').exists(), this.userContextGetSpecificUserRoles);
        router.post('/:userId/roles', authenticate, role(UserServiceRole.Application).needed, param('userId').exists(), body().isArray(), this.userContextAddRoleToSpecificUser);
        router.delete('/:userId/roles/:role', authenticate,
            role(UserServiceRole.Application).needed, param('userId').exists(), param('role').exists(),
            this.userContextDeleteRoleFromSpecificUser);

        return router;
    }

    deleteSpecificUser(req: Request, res: Response) {
        if (!validateParameters(req, res)) return;

        User.findByIdAndDelete(req.params.userId, (err, deleted) => {
            if (err) return res.sendStatus(500);

            return res.sendStatus(204);
        })
    }

    userContextDeleteRoleFromSpecificUser(req: Request, res: Response) {
        if (!validateParameters(req, res)) {
            return;
        }

        deleteRoleFromUser(res.locals.user, req.params.userId, req.params.role, res);
    }

    userContextAddRoleToSpecificUser(req: Request, res: Response) {
        if (!validateParameters(req, res)) {
            return;
        }

        addRoleToUser(res.locals.user, req.params.userId, req.body, res);
    }

    userContextGetSpecificUserRoles(req: Request, res: Response): any {
        if (!validateParameters(req, res))
            return;

        getRolesForUser(res.locals.user, req.params.userId, res);
    }

    getCurrentUserRoles(req: Request, res: Response): any {
        let caller: IUserDocument;

        if(<TokenType>res.locals.authType === TokenType.Application) {
            caller = res.locals.application;
        } else {
            caller = res.locals.user;
        }

        getRolesForUser(caller, res.locals.user._id, res);
    }

    updateCurrentUserPassword(req: Request, res: Response) {
        if (!validateParameters(req, res, false))
            return;
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

            return res.header('authorization', generateUserToken(user)).sendStatus(204);
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
        if (!validateParameters(req, res))
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
                  
            if (err || !user 
                /* Users are allowed to read Applications and Readers are allowed to read all users */) {
                return res.sendStatus(404);
            }

            if(user.roles.includes(UserServiceRole.Application)) {
                const userResponse = new UserResponse(user);
                userResponse.email = '';
                userResponse.passwordLastModified = '';
                return res.status(200).send(userResponse);
            }

            if(!(<IUserDocument>res.locals.user).roles.includes(UserServiceRole.Read) &&
            !(<IUserDocument>res.locals.user).roles.includes(UserServiceRole.Root)) {
                return res.sendStatus(404);
            }

            

            res.status(200).send(new UserResponse(user));
        });
    }

    setUserPassword(req: Request, res: Response): any {
    }
}