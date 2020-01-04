import { Request, Response, NextFunction } from "express";
import { IUserDocument, User } from "../models/user.model";

export enum UserServiceRole {
    Root = 'UserService-Root',
    Read = 'UserService-Read',
    Write = 'UserService-Write',
    Application = 'UserService-Application'
}

export class RoleValidation {
    constructor(public roles: string[]) {
        this.needed = this.needed.bind(this);
    }

    needed(req: Request, res: Response, next: NextFunction) {

        if (!res.locals.user)
            return res.sendStatus(401);

        const user: IUserDocument = res.locals.user;
        const missingRoles: string[] = [];

        if (user.roles.includes(UserServiceRole.Root))
            return next();

        this.roles.forEach(role => {
            if (!user.roles.includes(role)) {
                missingRoles.push(role);
            }
        });

        if (missingRoles.length > 0)
            return res.status(401).send({ message: 'You have not the needed Roles', missingRoles: missingRoles });

        next();

    }
}

export function role(...neededRoles: UserServiceRole[] | string[]): RoleValidation {
    return new RoleValidation(neededRoles);
}