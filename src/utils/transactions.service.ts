import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateTransactionRequest,
  PendingInvestment,
  Transaction,
} from './transaction.model';

import {
  environment,
} from '../env/environment.production';

export interface VoucherUrlResponse {
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionsService {
  private readonly apiUrl =
    `${environment.apiUrl}/transactions`;

  constructor(
    private readonly http: HttpClient,
  ) {}

  create(
    transaction: CreateTransactionRequest,
  ): Observable<Transaction> {
    const formData =
      new FormData();

    formData.append(
      'user_id',
      transaction.user_id,
    );

    formData.append(
      'type',
      transaction.type,
    );

    formData.append(
      'amount',
      transaction.amount.toString(),
    );

    formData.append(
      'voucher',
      transaction.voucher,
    );

    if (
      transaction.investment_id
    ) {
      formData.append(
        'investment_id',
        transaction.investment_id,
      );
    }

    if (
      transaction.description
    ) {
      formData.append(
        'description',
        transaction.description,
      );
    }

    return this.http.post<Transaction>(
      this.apiUrl,
      formData,
    );
  }

  findAll(
    userId?: string,
  ): Observable<Transaction[]> {
    const url = userId
      ? `${this.apiUrl}?user_id=${encodeURIComponent(userId)}`
      : this.apiUrl;

    return this.http.get<Transaction[]>(
      url,
    );
  }

  findPendingInvestments(
    userId: string,
  ): Observable<PendingInvestment[]> {
    const url =
      `${this.apiUrl}/investments/pending?user_id=${encodeURIComponent(userId)}`;

    return this.http.get<
      PendingInvestment[]
    >(url);
  }

  getVoucherUrl(
    transactionId: string,
  ): Observable<VoucherUrlResponse> {
    return this.http.get<VoucherUrlResponse>(
      `${this.apiUrl}/${transactionId}/voucher`,
    );
  }
}