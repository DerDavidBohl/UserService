import { RestController } from "../interfaces/rest-controller.interface";
import { Router, Request, Response } from "express";
import { World } from "../models/world.model";

export class HelloWorldController implements RestController {
    path: string = '/hello';    
    worlds: World[] = [];

    initializeRoutes(): Router {
        const router = Router();

        router.get('/', (req, res) => this.getAllWorlds(req, res));
        router.post('/', (req, res) => this.createNewWorld(req, res));
        
        router.get('/:id', (req, res) => this.getSpecificWorld(req, res));
        router.put('/:id', (req, res) => this.updateSpecificWorld(req, res));

        return router;
    }
    
    updateSpecificWorld(req: Request, res: Response): any {

        if(!this.worlds[req.params.id]) {
            res.status(404).send(`There is no World with Id ${req.params.id}`);
            return;
        }

        if(!this.validateBody(req.body)) {
            res.status(400).send();
        }
    }

    getSpecificWorld(req: Request, res: Response) {
        
        let w = this.worlds[req.params.id];

        if(w) {
            res.send(w);
        } else {
            res.status(404).send('World not found');
        }
    }

    createNewWorld(req: Request, res: Response): any {
        if(this.validateBody(req.body)) {
            this.worlds.push(req.body);

            const index = this.worlds.indexOf(req.body);
            res.header('location', req.baseUrl + '/' + index.toString()).send();

        } else {
            res.status(400).send('The World in Body does not match the World-Format.');
        }
    }

    getAllWorlds(req: Request, res: Response): any {
        res.send(this.worlds);
    }

    validateBody(body: any): boolean {
        return typeof(body.size) === 'number' && typeof(body.name) === 'string'
    }

    validateId(id: number): boolean {
        return this.worlds[id] != undefined;
    }


}