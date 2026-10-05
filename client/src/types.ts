export interface Cake {
  id: number;
  name: string;
  description: string;
  price: number;
  emoji: string;
}


export type OrderPayload = {
  customerName: string;
  phone: string;
  pickupDate: string;
  notes?: string;
  items: {
    cakeId: number;
    quantity: number;
  }[];
};

export type Order = {
  id: number;
  customerName: string;
  phone: string;
  items: OrderItem[];
  notes: string | null;
  pickupDate: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'picked_up';
  createdAt: string;
  createdById: number | null;
  daysUntilPickup?: number;
  isNearPickup?: boolean;
};

export type OrderItem = {
  id: number;
  orderId: number;
  cakeId: number;
  quantity: number;
  completedQuantity: number;
  cake: Cake;
};

export type Role = 'USER' | 'STAFF' | 'MANAGER' | 'ADMIN';

export type User = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
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

export type Ingredient = {
  id: number;
  name: string;
  unit: string;
  description: string | null;
  inventory: {
    id: number;
    ingredientId: number;
    quantity: number;
    lowStockThreshold: number;
  };
};

export type CreateIngredientPayload = {
  name: string;
  unit: string;
  description?: string;
  quantity: number;
  lowStockThreshold: number;
};

export type OrderAvailability = {
  orderId: number;
  available: boolean;
  ingredients: {
    ingredientId: number;
    name: string;
    unit: string;
    required: number;
    available: number;
    sufficient: boolean;
  }[];
};
