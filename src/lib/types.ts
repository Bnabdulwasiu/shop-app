/** A product as stored in the `products` table. */
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  stock: number;
  active: boolean;
};

/** A single line in the shopping cart (client-side shape, camelCase). */
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  quantity: number;
};

/** A persisted order row. */
export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  shipping_address: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  status: string;
  email_status: string;
  notes: string | null;
  created_at: string;
};

/** A persisted order line item. */
export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

/** Payload the checkout form sends to `/api/checkout`. */
export type CheckoutPayload = {
  items: { productId: string; quantity: number }[];
  customer: {
    full_name: string;
    email: string;
    phone?: string;
    shipping_address: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    notes?: string;
  };
};
