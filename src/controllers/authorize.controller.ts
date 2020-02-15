import { RestController } from "../interfaces/rest-controller.interface";
import { Router, Request, Response } from "express";
import { authenticate, generateApplicationUserToken as generateApplicationUserToken } from "../utils/authenticate";
import { query } from "express-validator";
import { validateParameters } from "../utils/validate";
import { AppTokenCode, IAppTokenCode } from "../models/app.token.code.model";

export class AuthorizeController implements RestController {
    path: string = '/authorize';

    initializeRoutes(): import("express").Router {
        const router = Router();

        router.get('/code', authenticate, query('redirect').exists(), this.redirectWithCode);
        router.get('/token', authenticate, query('code').exists(), this.getTokenByCode);
        router.get('/dummy', this.dummyTestRouteCall);
        return router;
    }

    dummyTestRouteCall(req: Request, res: Response) {
        return res.header('Cache-Control', 'no-cache, no-store, must-revalidate').send({ queryParams: req.query });
    }

    redirectWithCode(req: Request, res: Response): any {
        if (!validateParameters(req, res)) return;

        const now = new Date();

        AppTokenCode.create([<IAppTokenCode>{ application: res.locals.user }], (err, created) => {
            if (!created || err || created.length != 1 || created[0].createdAt.valueOf() < now.setSeconds(now.getSeconds() - 10).valueOf()) {
                return res.status(500).send({ message: 'Code generation failed' });
            }

            console.log(created);


            return res.redirect(`${process.env.FRONT_END_LOGIN_URL}?code=${created[0].code}&redirect=${req.query.redirect}`, 301);
        });
    }

    getTokenByCode(req: Request, res: Response): any {
        if (!validateParameters(req, res)) return;

        const now = new Date();

        AppTokenCode.findOne({ code: req.query.code }).populate('application').exec((err, appTokenCode) => {

            if (err || !appTokenCode) {
                return res.status(404).send({ message: 'Code not found' });
            }

            if (appTokenCode.createdAt.valueOf() < now.setSeconds(now.getSeconds() - 10).valueOf()) {
                console.log('Token outdated -> delete');
                appTokenCode.remove(() => res.status(404).send({ message: 'Code not found' }));
                return;
            }

            const token = generateApplicationUserToken(res.locals.user, appTokenCode.application)

            appTokenCode.remove(() => {
                return res.header('authorization', token).send({ token: token });
            });
        });
    }


}