import { UserResponse } from "./user.model";
export interface IJsonWebToken {
    user: UserResponse;
    type: TokenType;
}

export interface JsonWebToken {
    payload: any;
}

export class UserJsonWebTokenPayload implements IJsonWebToken {
    type = TokenType.User;
    constructor(public user: UserResponse){}
}

export class ApplicationJsonWebTokenPayload implements IJsonWebToken {
    type = TokenType.Application;
    constructor(public user: UserResponse, public application: UserResponse){};
}


export enum TokenType {
    User,
    Application
}