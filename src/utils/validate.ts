import { Request, Response } from "express";
import { validationResult } from "express-validator";

export const validateParameters = function (req: Request, res: Response, sendReasons: boolean = true): boolean {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (sendReasons) {
            res.status(422).json({ message: `Something is wrong with your request. Sent body: ${req.body}`, errors: errors.array() });
        } else {
            res.status(422).json({ message: `Something is wrong with your request.`});
        }

        return false;
    }

    return true;
}