import { RestApp } from "./utils/rest-app";
import { UserController } from "./controllers/user.controller";
import mongoose from "mongoose";
import { LoginController } from "./controllers/login.controller";
import { ResetController } from "./controllers/reset.controller";
import { User, IUser } from "./models/user.model";
import { createUser } from "./utils/createUser";
import { UserServiceRole } from "./utils/roles";
import { AuthorizeController } from "./controllers/authorize.controller";

const port = process.env.PORT as unknown as number || 3000;

const app = new RestApp(port, [
    new UserController(),
    new LoginController(),
    new ResetController(),
    new AuthorizeController(),
], '/user-service/api/v1', '/swagger');

mongoose.connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/user-service`,
    { useNewUrlParser: true, user: process.env.MONGO_USER, pass: process.env.MONGO_PASSWORD, authMechanism: 'DEFAULT', authSource: 'admin' }, (err) => {
        if (err) {
            console.error('Could not connect to mongo!')
            console.error(err);
            return;
        }

        app.start(() => {
            //Do initial things here

            User.find((err, users) => {
                if (err || !users || users.length > 0)
                    return;

                if (!process.env.INITIAL_USER) {
                    console.error('Env Var INITIAL_USER is not set please set it in this schema for your initial root user: {"name": "YOURNAME", "email":"YOUREMAIL", "password": "YOURSECRETPASSWORD"}');
                    return;
                }
                const user: IUser = JSON.parse(process.env.INITIAL_USER);
                user.roles = [UserServiceRole.Root];

                createUser(user, (err, userDoc) => {
                    console.log('Initial Root User Created');
                    
                });
            });
        });
    });