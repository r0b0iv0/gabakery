import { Role } from "./types";

export { };

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                name: string | null;
                role: Role
            };
        }
    }
}
