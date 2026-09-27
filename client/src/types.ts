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
  status: 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'picked_up';
  createdAt: string;
}

export type Role = 'USER' | 'STAFF' | 'MANAGER' | 'ADMIN';

export type User = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
};

export type Ingredient = {
  id: number;
  name: string;
  unit: string;
  description?: string | null;
};

export type CreateCakePayload = {
  name: string;
  description: string;
  price: number;
  emoji?: string;
  recipe: {
    name: string;
    description?: string;
    ingredients: {
      ingredientId: number;
      quantity: number;
    }[];
  };
};

