import { RestApp } from "./utils/rest-app";
import { UserController } from "./controllers/user.controller";
import mongoose from "mongoose";
import { AuthController } from "./controllers/auth.controller";
import { ResetController } from "./controllers/reset.controller";

const port = process.env.PORT as unknown as number || 3000;

const app = new RestApp(port, [
    new UserController(),
    new AuthController(),
    new ResetController()
]);

mongoose.connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/user-service`,
    { useNewUrlParser: true, user: process.env.MONGO_USER, pass: process.env.MONGO_PASSWORD, authMechanism: 'DEFAULT', authSource: 'admin' }, (err) => {
        if (err) {
            console.error('Could not connect to mongo!')
            console.error(err);
            return;
        }
        app.start();
    });