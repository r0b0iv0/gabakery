export interface Cake {
  id: number;
  name: string;
  description: string;
  price: number;
  emoji: string;
}


export interface OrderPayload {
  customerName: string;
  phone: string;
  cakeId?: number;
  notes?: string;
  pickupDate: string; // YYYY-MM-DD
}

export interface Order {
  id: number;
  customerName: string;
  phone: string;
  isCustom: boolean;
  cake?: Cake | null;
  notes?: string | null;
  pickupDate: string;
  status: 'pending' | 'in_progress' | 'ready' | 'picked_up';
  createdAt: string;
}

export type Role = 'USER' | 'STAFF' | 'ADMIN';

export type User = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
};

