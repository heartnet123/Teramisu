export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  stock: number;
  wellnessGoals?: string[];
  ingredients?: string[];
  rating?: number;
  popularityScore?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: CartItem[];
}

export type ViewState = 'HOME' | 'SHOP' | 'CART' | 'PROFILE' | 'ADMIN' | 'AUTH' | 'PRODUCT_DETAIL';

export interface SalesData {
  name: string;
  sales: number;
  revenue: number;
}