import type { User } from '../types';

export function canAccessBakerView(user: User | null) {
    return user?.role === 'STAFF' || user?.role === 'ADMIN';
}
