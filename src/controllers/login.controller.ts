import { RestController } from "../interfaces/rest-controller.interface";
import { Router, Request, Response } from "express";
import { check } from "express-validator";
import { User, IUserDocument, UserResponse, UserJsonWebTokenPayload } from "../models/user.model";
import { compare, compareSync } from "bcryptjs";
import { generateUserToken } from "../utils/authenticate";

export class LoginController implements RestController {
    path: string = '/login';
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

            const token = generateUserToken(user);

            res.header('authorization', token).status(200).send({ token: token });
        });
    }
}