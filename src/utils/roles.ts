import { RoleValidation } from "./RoleValidation";

export enum UserServiceRole {
    Root = 'UserService-Root',
    Read = 'UserService-Read',
    Write = 'UserService-Write',
    Application = 'UserService-Application',
    User = 'UserService-User',
}

export function role(...neededRoles: UserServiceRole[] | string[]): RoleValidation {
    return new RoleValidation(neededRoles);
}