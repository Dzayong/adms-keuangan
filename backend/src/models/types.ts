export type UserRole = 'ADMIN' | 'OPERATOR' | 'MERCHANT' | 'IT';

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
  password_hash: string;
  role: UserRole;
  profile_photo?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  profile_photo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  idempotency_key?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  // Join fields
  creator_name?: string;
  payment_id?: number;
  qr_content?: string;
  provider_reference?: string;
  payment_method?: string;
  provider_code?: string;
}

export interface Payment {
  id: number;
  transaction_id: number;
  provider_id: number;
  provider_reference: string;
  qr_content: string;
  payment_method: string;
  status: TransactionStatus;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentProviderModel {
  id: number;
  name: string;
  code: string;
  environment: 'sandbox' | 'production';
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentLog {
  id: number;
  payment_id: number;
  event_type: string;
  reference: string;
  payload: string;
  created_at: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  updated_at: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  name: string;
  profile_photo?: string;
  source_system?: string;
}
