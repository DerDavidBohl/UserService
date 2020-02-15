import { User, TokenType } from "../models/user.model";
import { RoleValidation } from "./RoleValidation";
import { ContextValidation } from "./ContextValidation";

export enum UserServiceRole {
    Root = 'UserService-Root',
    Read = 'UserService-Read',
    Write = 'UserService-Write',
    Application = 'UserService-Application'
}

export function role(...neededRoles: UserServiceRole[] | string[]): RoleValidation {
    return new RoleValidation(neededRoles);
}