import { Router } from "express";

export interface RestController {
    path: string;
    initializeRoutes(): Router;
}