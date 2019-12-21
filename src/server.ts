import { RestApp } from "./utils/rest-app";
import { UserController } from "./controllers/user.controller";

const app = new RestApp(3000, [
    new UserController()
]);
app.start();