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
    return this.http.post<Transaction>(
      this.apiUrl,
      transaction,
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
}