import type { Cake, CreateCakePayload, CreateIngredientPayload, Ingredient, Order, OrderAvailability, OrderPayload, User } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Заявката се провали (${res.status})`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const api = {
  register: (email: string, password: string, name?: string) =>
    request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    }),

  login: (email: string, password: string) =>
    request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    }),

  logout: () =>
    request<void>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{ user: User }>('/auth/me'),


  getCakes: () => request<Cake[]>('/cakes'),
  createOrder: (payload: OrderPayload) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getOrdersByDate: (date: string) => request<Order[]>(`/orders?date=${date}`),
  updateOrderStatus: (id: number, status: Order['status']) =>
    request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getIngredients: () =>
    request<Ingredient[]>('/ingredients'),

  createCake: (payload: CreateCakePayload) =>
    request<Cake>('/cakes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createIngredient: (payload: CreateIngredientPayload) =>
    request<Ingredient>('/ingredients', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addIngredientStock: (id: number, quantity: number) =>
    request<Ingredient>(`/ingredients/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),

  getManagementOrders: () =>
    request<Order[]>('/management/orders'),

  getOrderAvailability: (id: number) =>
    request<OrderAvailability>(
      `/management/orders/${id}/availability`
    ),

  confirmOrder: (id: number) =>
    request<Order>(
      `/management/orders/${id}/confirm`,
      {
        method: 'PATCH',
      }
    ),

};
