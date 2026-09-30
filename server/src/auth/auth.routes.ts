import { Router } from "express"
import crypto from "node:crypto";
import argon2 from "argon2";
import { prisma } from "../db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/login", async (req, res) => {
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

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body ?? {};

    if (!email) {
        return res.status(400).json({
            error: 'Имейлът е задължителен.',
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase().trim(),
            },
        });

        if (!user) {
            return res.json({
                message:
                    'Ако съществува акаунт с този имейл, ще бъде изпратен линк за възстановяване.',
            });
        }

        await prisma.passwordResetToken.deleteMany({
            where: {
                userId: user.id,
            },
        });

        const token = crypto.randomBytes(32).toString('hex');

        await prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        const resetUrl =
            `http://localhost:5173/reset-password?token=${token}`;

        console.log('Password reset URL:', resetUrl);

        res.json({
            message:
                'Ако съществува акаунт с този имейл, ще бъде изпратен линк за възстановяване.',
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Възникна грешка.',
        });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body ?? {};

    if (!token || !password) {
        return res.status(400).json({
            error: 'Липсват задължителни данни.',
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            error: 'Паролата трябва да бъде поне 6 символа.',
        });
    }

    try {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: {
                token,
            },
        });

        if (!resetToken) {
            return res.status(400).json({
                error: 'Невалиден или изтекъл линк.',
            });
        }

        if (resetToken.expiresAt < new Date()) {
            await prisma.passwordResetToken.delete({
                where: {
                    id: resetToken.id,
                },
            });

            return res.status(400).json({
                error: 'Линкът за възстановяване е изтекъл.',
            });
        }

        const passwordHash = await argon2.hash(password, { hashLength: 10 });

        await prisma.user.update({
            where: {
                id: resetToken.userId,
            },
            data: {
                passwordHash,
            },
        });

        await prisma.passwordResetToken.delete({
            where: {
                id: resetToken.id,
            },
        });

        res.json({
            message: 'Паролата беше променена успешно.',
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Неуспешно променяне на паролата.',
        });
    }
});

router.get("/me", requireAuth, (req, res) => {
    res.json({
        user: req.user,
    });
});

export default router
