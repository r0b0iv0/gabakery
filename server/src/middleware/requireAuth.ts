import { Request, Response, NextFunction } from "express";
import { prisma } from "../db";
import { isRole } from "../types/types";

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const sessionId = req.cookies.session;

    if (!sessionId) {
        return res.status(401).json({
            error: "Не сте влезли в системата.",
        });
    }

    const session = await prisma.session.findUnique({
        where: {
            id: sessionId,
        },
        include: {
            user: true,
        },
    });

    if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({
            error: "Сесията е изтекла.",
        });
    }

    if (!isRole(session.user.role)) {
        return res.status(500).json({
            error: "Invalid user role.",
        });
    }

    req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
    };

    next();
}
