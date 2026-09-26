export const ROLES = ["USER", "STAFF", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
    return ROLES.includes(value as Role);
}