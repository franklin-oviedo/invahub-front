export type TransactionType =
  'INVESTMENT' | 'RETURN';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  capital: number;
  profit: number;
  description?: string | null;
  voucher_path?: string | null;
  created_at: string;
}

export interface CreateTransactionRequest {
  user_id: string;
  type: TransactionType;
  amount: number;
  description?: string;
}