import {Response} from "express";
import { User, IUser, IUserDocument } from "../models/user.model";
import { UserServiceRole } from "./roles";

export function deleteRoleFromUser(callingUser: IUser, targetUserId: string, role: string, res: Response) {

    if (!role.startsWith(`${callingUser.name}-`) && !callingUser.roles.includes(UserServiceRole.Root))
        return res.status(400).send({ message: `You are only allowed to add/remove roles starting with "${callingUser.name}-".` });
        
    User.findById(targetUserId, (err, user) => {
        if (err || !user)
            return res.sendStatus(404);

        for (let index = 0; index < user.roles.length; index++) {
            const element = user.roles[index];

            if (element === role)
                user.roles.splice(index, 1);
        }

        user.save((_err, _product) => {
            return res.sendStatus(204);
        });
    });
}

export function addRoleToUser(callingUser: IUser, targetUserId: string, roles: string[], res: Response) {

    if (!callingUser.roles.includes(UserServiceRole.Root)) {
        for (let i = 0; i < roles.length; i++) {
            const role = roles[i];

            if (!role.startsWith(callingUser.name))
                return res.status(400).send({ message: 'You are not allowed to post roles with this name' });
        }
    }

    User.findById(targetUserId, (err, user) => {
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

export function getRolesForUser(callingUser: IUserDocument, targetUserId: string, res: Response){

    User.findById(targetUserId, (err, user) => {
        if (err || !user)
            return res.sendStatus(404);


        if(targetUserId === callingUser._id) {
            res.send(user.roles);
            return;
        }

        const visibleRoles: string[] = [];

        user.roles.forEach(role => {
            if (role.startsWith(`${callingUser.name}-`) || callingUser.roles.includes(UserServiceRole.Root))
                visibleRoles.push(role);
        });

        res.send(visibleRoles);
    });
}