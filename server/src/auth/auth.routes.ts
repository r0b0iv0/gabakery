import { Router } from "express"
import crypto from "node:crypto";
import argon2 from "argon2";
import { prisma } from "../db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/login", async (req, res) => {
    console.log(req.body)
    const { email, password } = req.body;


    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !(await argon2.verify(user.passwordHash, password))) {
        return res.status(401).json({
            error: "Невалиден имейл или парола.",
        });
    }

    const sessionId = crypto.randomBytes(32).toString("hex");

    await prisma.session.create({
        data: {
            id: sessionId,
            userId: user.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
    });

    res.cookie("session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    });
});

router.post("/register", async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: "Имейлът и паролата са задължителни.",
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            error: "Паролата трябва да е поне 8 символа.",
        });
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return res.status(409).json({
            error: "Потребител с този имейл вече съществува.",
        });
    }

    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            name: name ?? null,
            role: "USER",
        },
    });

    // Log the user in immediately
    const sessionId = crypto.randomBytes(32).toString("hex");

    await prisma.session.create({
        data: {
            id: sessionId,
            userId: user.id,
            expiresAt: new Date(
                Date.now() + 1000 * 60 * 60 * 24 * 7
            ),
        },
    });

    res.cookie("session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.status(201).json({
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    });
});

router.post("/logout", async (req, res) => {
    const sessionId = req.cookies.session;

    if (sessionId) {
        await prisma.session.deleteMany({
            where: {
                id: sessionId,
            },
        });
    }

    res.clearCookie("session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    return res.status(204).send();
});

router.get("/me", requireAuth, (req, res) => {
    res.json({
        user: req.user,
    });
});

export default router
