export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category_id: string | null;
  image: string | null;
  images: string[];
  stock: number;
  sku: string | null;
  is_active: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string;
  deleted_at: string | null;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total: number;
  currency: string;
  payment_status: 'approved' | 'pending' | 'rejected';
  payment_id: string | null;
  preference_id: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  currency: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type InventoryMovement = {
  id: string;
  product_id: string;
  quantity: number;
  type: 'sale' | 'restock' | 'adjustment';
  reference: string | null;
  created_at: string;
};
