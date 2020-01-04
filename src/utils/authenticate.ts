import { Request, Response, NextFunction } from "express";
import jsonwebtoken, { sign } from "jsonwebtoken";
import { IUserJsonWebToken, User, IUserDocument, UserResponse } from "../models/user.model";

export function authenticate(req: Request, res: Response, next: NextFunction) {

  if (!process.env.JWT_SECRET) {
    console.error('Required Env war JWT_SECRET is not set!');
    return res.sendStatus(500);
  }

  const token = <string>req.headers.authorization;
  let jwtPayload: IUserJsonWebToken;

  //Try to validate the token and get data
  try {
    jwtPayload = <IUserJsonWebToken>jsonwebtoken.verify(token, process.env.JWT_SECRET);

    User.findById(jwtPayload.user.id, (err, user) => {
      if (err || !user || user.passwordLastModified.toString() !== jwtPayload.passwordLastModified) {
        return res.status(401).send({ message: 'Token invalid' });
      }

      res.locals.user = user;

      //Call the next middleware or controller
      next();

    });

  } catch (error) {
    //If token is not valid, respond with 401 (unauthorized)
    res.status(401).send({ message: 'Token invalid' });
    return;
  }
}

export function generateDefaultJWT(user: IUserDocument) {
  return sign(<IUserJsonWebToken>{ user:new UserResponse(user), passwordLastModified: user.passwordLastModified.toString()},
                process.env.JWT_SECRET || 'Unsecure Secret!!!!',
                { expiresIn: "1 day" });
}