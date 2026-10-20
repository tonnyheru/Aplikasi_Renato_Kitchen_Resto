export type Role = 'owner' | 'manager' | 'admin' | 'cashier' | 'kitchen' | 'inventory';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  products_count?: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  price_adjustment: number;
}

export interface ProductAddon {
  id: number;
  product_id: number;
  name: string;
  price: number;
}

export interface Product {
  id: number;
  category_id: number;
  sku: string;
  name: string;
  description?: string;
  image_url?: string;
  base_price: number;
  cost_price: number;
  prep_time_minutes: number;
  is_active: boolean;
  is_available: boolean;
  category?: Category;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  recipe?: {
    id: number;
    yield_servings: number;
    items?: Array<{
      id: number;
      ingredient_id: number;
      quantity: number;
      ingredient?: Ingredient;
    }>;
  };
}

export interface DiningTable {
  id: number;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_order_id?: number | null;
  current_order?: Order;
}

export interface OrderItemAddon {
  id: number;
  order_item_id: number;
  addon_name: string;
  price: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id?: number | null;
  product_name: string;
  variant_name?: string | null;
  unit_price: number;
  cost_price: number;
  quantity: number;
  subtotal: number;
  special_notes?: string | null;
  addons?: OrderItemAddon[];
}

export interface Payment {
  id: number;
  order_id: number;
  payment_method: 'cash' | 'qris' | 'transfer';
  amount_paid: number;
  change_amount: number;
  transaction_ref?: string | null;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  paid_at?: string;
}

export interface Order {
  id: number;
  order_number: string;
  order_type: 'dine_in' | 'takeaway' | 'online';
  table_id?: number | null;
  user_id?: number | null;
  customer_name: string;
  customer_phone?: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  service_charge_amount: number;
  total_amount: number;
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  notes?: string | null;
  created_at: string;
  items?: OrderItem[];
  table?: DiningTable;
  payment?: Payment;
}

export interface Ingredient {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
  is_active: boolean;
}

export interface StockOpnameItem {
  id: number;
  stock_opname_id: number;
  ingredient_id: number;
  system_stock: number;
  physical_stock: number;
  discrepancy: number;
  discrepancy_cost: number;
  reason?: string;
  ingredient?: Ingredient;
}

export interface StockOpname {
  id: number;
  opname_number: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  created_by?: number;
  approved_by?: number;
  notes?: string;
  created_at: string;
  items?: StockOpnameItem[];
  creator?: User;
  approver?: User;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  ingredients_count?: number;
  purchase_orders_count?: number;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  ingredient_id: number;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  ingredient?: Ingredient;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  status: 'draft' | 'submitted' | 'received' | 'cancelled';
  total_cost: number;
  user_id?: number | null;
  received_at?: string | null;
  created_at: string;
  supplier?: Supplier;
  user?: User;
  items?: PurchaseOrderItem[];
}

export interface CashShift {
  id: number;
  user_id: number;
  start_cash: number;
  expected_cash: number;
  actual_cash?: number | null;
  difference: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  notes?: string;
  cash_sales?: number;
}

export interface DashboardMetrics {
  period: string;
  metrics: {
    revenue: number;
    transaction_count: number;
    average_order_value: number;
    cogs: number;
    gross_profit: number;
    expenses: number;
    active_kitchen_orders: number;
  };
  top_products: Array<{
    product_name: string;
    total_qty: number;
    total_sales: number;
  }>;
  low_stock_items: Ingredient[];
  payment_breakdown: Array<{
    payment_method: string;
    count: number;
    total: number;
  }>;
}

export interface RestaurantSetting {
  id: number;
  name: string;
  phone: string;
  email: string;
  address?: string;
  currency: string;
  tax_rate: number;
  service_charge_rate: number;
  is_tax_enabled: boolean;
  is_service_charge_enabled: boolean;
  receipt_footer: string;
  qris_provider?: string;
  qris_type?: 'static' | 'dynamic';
  qris_merchant_name?: string;
  qris_nmid?: string;
  qris_image_url?: string;
}
