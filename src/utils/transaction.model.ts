export type TransactionType =
  'INVESTMENT' | 'RETURN';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  capital: number;
  profit: number;
  investment_id?: string | null;
  description?: string | null;
  voucher_path?: string | null;
  created_at: string;
}

export interface CreateTransactionRequest {
  user_id: string;
  type: TransactionType;
  amount: number;
  investment_id?: string;
  description?: string;
}

export type InvestmentStatus =
  'PENDING' | 'PARTIAL' | 'PAID';

export interface PendingInvestment
  extends Transaction {
  originalAmount: number;
  returnedCapital: number;
  pendingCapital: number;
  status: InvestmentStatus;
}