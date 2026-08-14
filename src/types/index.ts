export type UserRole = 'ADMIN' | 'OPERATOR';

export type TransactionStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  profile_photo?: string;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  description: string;
  status: TransactionStatus;
  expired_at: string;
  paid_at?: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  payment_id?: number;
  qr_content?: string;
  provider_reference?: string;
  payment_method?: string;
  provider_code?: string;
}

export interface PaymentLog {
  id: number;
  payment_id: number;
  event_type: string;
  reference: string;
  payload: string;
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface DashboardStats {
  total_count: number;
  total_amount: number;
  paid_count: number;
  paid_amount: number;
  pending_count: number;
  pending_amount: number;
  failed_count: number;
  failed_amount: number;
}

export interface ChartDataPoint {
  date: string;
  paid_amount: number;
  count: number;
}
