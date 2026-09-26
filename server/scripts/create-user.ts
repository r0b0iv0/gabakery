import argon2 from "argon2";
import { prisma } from "../src/db";

async function main() {
    const [email, password, role = "USER", name] =
        process.argv.slice(2);

    if (!email || !password) {
        console.error(
            "Usage: npm run create-user -- email password [role] [name]"
        );
        process.exit(1);
    }

    const roles = ["USER", "STAFF", "ADMIN"];

    if (!roles.includes(role)) {
        console.error(`Invalid role: ${role}`);
        process.exit(1);
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.error(`User already exists: ${email}`);
        process.exit(1);
    }

    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role,
            name: name ?? null,
        },
    });

    console.log(`Created user: ${user.email} (${user.role})`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });