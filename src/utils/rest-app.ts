import { RestController } from "../interfaces/rest-controller.interface";
import express from "express";
import YAML = require("yamljs");
import swaggerUI from 'swagger-ui-express';
import {Request, Response} from "express";

const swaggerDocument = YAML.load("swagger.yml");

export class RestApp {

    private app: express.Application = express();;

    constructor(private port: number, controllers: RestController[], apiRoute: string = '/api/v1') {
        
        this.app.use(express.json());
        this.app.use(apiRoute + '/swagger', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

        controllers.forEach(controller => {

            if(!controller.path) {
                throw new Error('The Controller does not have any path.')
            }

            this.app.use(apiRoute + controller.path, controller.initializeRoutes());
        });

        this.app.use((err: Error, req: Request, res: Response, next: any) => {
            console.error(err);
            res.status(500).send('Something went wrong!!');
        });
    }

    start(callback?: () => void) {
        this.app.listen(this.port, () => {
            console.log(`App started (Port: ${this.port})`);
           
            if(callback)
                callback();
        });
    }
}