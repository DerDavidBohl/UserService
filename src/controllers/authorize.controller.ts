import { RestController } from "../interfaces/rest-controller.interface";
import { Router, Request, Response } from "express";
import { authenticate, generateApplicationUserToken as generateApplicationUserToken } from "../utils/authenticate";
import { query, body } from "express-validator";
import { validateParameters } from "../utils/validate";
import { LoginCode, ILoginCode } from "../models/login.code.model";
import { User, TokenType } from "../models/user.model";
import { UserServiceRole } from "../utils/roles";

export class AuthorizeController implements RestController {
    path: string = '/authorize';

    initializeRoutes(): import("express").Router {
        const router = Router();

        router.post('/code', authenticate, body('application_id').exists(), this.generateCode);
        router.get('/token', authenticate, query('code').exists(), this.getTokenByCode);
        router.get('/dummy', this.dummyTestRouteCall);
        return router;
    }

    dummyTestRouteCall(req: Request, res: Response) {
        return res.header('Cache-Control', 'no-cache, no-store, must-revalidate').send({ queryParams: req.query });
    }

    generateCode(req: Request, res: Response): any {
        if (!validateParameters(req, res)) return;

        if(res.locals.authType !== TokenType.Application)
            return res.status(403).send()

        const now = new Date();

        User.findById(req.body.application_id, (err, application) => {
            if(err || !application || !application.roles.includes(UserServiceRole.Application)) {
                return res.status(404).send({message: `Could not find Application ID ${req.query.application_id}`});
            }

            LoginCode.create([<ILoginCode>{ user: res.locals.user, application: application }], (err, created) => {
                if (!created || err || created.length != 1 || created[0].createdAt.valueOf() < now.setSeconds(now.getSeconds() - 10).valueOf()) {
                    return res.status(500).send({ message: 'Code generation failed' });
                }
    
                res.send({code: created[0].code});
            });
        });
    }

    getTokenByCode(req: Request, res: Response): any {
        if (!validateParameters(req, res)) return;

        const now = new Date();

        LoginCode.findOne({ code: req.query.code }).populate('user').populate('application').exec((err, loginCode) => {

            if (err || !loginCode) {
                return res.status(404).send({ message: 'Code not found' });
            }

            if (loginCode.createdAt.valueOf() < now.setSeconds(now.getSeconds() - 10).valueOf()) {
                console.log('Token outdated -> delete');
                loginCode.remove(() => res.status(404).send({ message: 'Code not found' }));
                return;
            }

            const token = generateApplicationUserToken(loginCode.user, loginCode.application);

            loginCode.remove(() => {
                return res.header('authorization', token).send({ token: token });
            });
        });
    }


}