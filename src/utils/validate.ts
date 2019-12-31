import { Request, Response } from "express";
import { validationResult } from "express-validator";

export const validate = function(req: Request, res: Response): boolean {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(422).json({ message: `Something is wrong with your request. Sent body: ${req.body}`, errors: errors.array() });
        return false;
    }

    return true;
}