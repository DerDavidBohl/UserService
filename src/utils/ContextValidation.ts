import { TokenType } from "../models/user.model";
import { NextFunction, Request, Response } from "express";
export class ContextValidation {
    constructor(private context: TokenType) {
        this.allowed = this.allowed.bind(this);
     }

    allowed(req: Request, res: Response, next: NextFunction) {
        
        if (res.locals.authType !== this.context) {
            return res.status(401).send({ message: 'You must be logged in User Context only' });
        }
        else {
            next();
        }
    }
}

export function onlyContext(context: TokenType): ContextValidation {
    return new ContextValidation(context);
}
