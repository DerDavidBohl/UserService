import { Request, Response, NextFunction } from "express";
import jsonwebtoken, { sign, SignOptions } from "jsonwebtoken";
import { User, IUserDocument, UserResponse } from "../models/user.model";
import { IJsonWebToken, JsonWebToken, TokenType, ApplicationJsonWebTokenPayload, UserJsonWebTokenPayload } from "../models/tokens";

export function authenticate(req: Request, res: Response, next: NextFunction) {

  if (!process.env.JWT_SECRET) {
    console.error('Required Env war JWT_SECRET is not set!');
    return res.sendStatus(500);
  }

  const token = <string>req.headers.authorization;
  let jwtPayload: IJsonWebToken;

  //Try to validate the token and get data
  try {
    jwtPayload = (<JsonWebToken>jsonwebtoken.verify(token, process.env.JWT_SECRET)).payload;

    User.findById(jwtPayload.user.id, (err, user) => {
      if (err || !user || user.passwordLastModified.toString() !== jwtPayload.user.passwordLastModified) {
        return res.status(401).send({ message: 'Token invalid' });
      }

      res.locals.user = user;
      res.locals.authType = jwtPayload.type;

      if (jwtPayload.type === TokenType.Application) {
        const appTokenPayload = <ApplicationJsonWebTokenPayload>jwtPayload;

        User.findById(appTokenPayload.application.id, (err, application) => {
          if (err || !application || application.passwordLastModified.toString() !== appTokenPayload.application.passwordLastModified) {
            return res.status(401).send({ message: 'Token invalid' });
          }

          res.locals.application = application;
          next();
        });
      } else {

        //Call the next middleware or controller
        next();

      }
    });

  } catch (error) {
    //If token is not valid, respond with 401 (unauthorized)
    res.status(401).send({ message: 'Token invalid' });
    return;
  }
}

export function generateUserToken(caller: IUserDocument, expiresIn: string | undefined = '1d') {
  const options: SignOptions | undefined = expiresIn ? {
    expiresIn: expiresIn
  } : undefined;

  const payload = new UserJsonWebTokenPayload(new UserResponse(caller))

  return sign({ payload },
    process.env.JWT_SECRET || 'Unsecure Secret!!!!', options);
}

export function generateApplicationUserToken(user: IUserDocument, application: IUserDocument, expiresIn: string | undefined = "1d") {

  const options: SignOptions | undefined = expiresIn ? {
    expiresIn: expiresIn
  } : undefined;
  const payload = new ApplicationJsonWebTokenPayload(new UserResponse(user), new UserResponse(application));
  return sign({ payload },
    process.env.JWT_SECRET || 'Unsecure Secret!!!!', options);

}