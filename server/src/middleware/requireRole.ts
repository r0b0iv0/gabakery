import { Request, Response, NextFunction } from "express";
import { Role } from "../types/types";


export function requireRole(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: "Не сте влезли в системата.",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Нямате права за тази операция.",
            });
        }

        next();
    };
}
