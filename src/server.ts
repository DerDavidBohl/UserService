import { RestApp } from "./utils/rest-app";
import { HelloWorldController } from "./controllers/hello-world.controller";

const app = new RestApp(3000, [
    new HelloWorldController()
]);
app.start();