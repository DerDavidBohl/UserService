import { RestController } from "../interfaces/rest-controller.interface";
import { Router, Request, Response } from "express";
import { check } from "express-validator";
import { sign } from "jsonwebtoken";
import { User, IUser, IUserDocument } from "../models/user.model";
import { compare, compareSync } from "bcryptjs";

export class AuthController implements RestController {
    path: string = '/auth';
    initializeRoutes(): Router {
        const router = Router();

        router.post('/', [
            check('email').exists(),
            check('password').exists()]
            , this.getJWT)

        return router;
    }

    getJWT(req: Request, res: Response) {
        User.findOne(<IUserDocument>{ email: req.body.email,  emailVerified: true}, (err, user) => {

            if (!user || err || !compareSync(req.body.password, user.password)) {
                return res.sendStatus(404);
            }

            const token = sign({ user: <IUser>user },
                process.env.JWT_SECRET || 'Backup Value please set JWT_SECRET env',
                { expiresIn: "1 day" });

            res.header('authorization', token).status(200).send({ token: token });
        });
    }
}