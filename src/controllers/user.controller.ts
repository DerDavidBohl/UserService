import { RestController } from "../interfaces/rest-controller.interface";
import { Router, Request, Response } from "express";

export class UserController implements RestController {
    path: string = '/users';    
    
    initializeRoutes(): import("express").Router {
        const router = Router();
        
        router.get('/', this.getAllUsers)
        
        return router;
    }

    getAllUsers(req: Request, res: Response): any {
        res.send([]);
    }
}