import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Transaction } from '../../utils/transaction.model';
import { TransactionsService } from '../../utils/transactions.service';

interface Investor {
  id: string;
  name: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  readonly investors: Investor[] = [
    {
      id: 'bernabe-oviedo',
      name: 'Bernabe Oviedo',
    },
    {
      id: 'neftali-oviedo',
      name: 'Neftali Oviedo',
    },
    {
      id: 'dominic-minaya',
      name: 'Dominic Minaya',
    },
    {
      id: 'otniel-oviedo',
      name: 'Otniel Oviedo',
    },
  ];

  selectedInvestorId = '';

  dashboardInvestorId = 'ALL';

  transactionType: 'INVESTMENT' | 'RETURN' =
    'INVESTMENT';

  amount: number | null = null;
  description = '';

  transactions: Transaction[] = [];

  invested = 0;
  returned = 0;
  profit = 0;

  loading = false;
  saving = false;

  currentPage = 1;

  readonly pageSize = 5;

  constructor(
    private readonly transactionsService:
      TransactionsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  get balanceToReturn(): number {
    return Math.max(
      this.invested - this.returned,
      0,
    );
  }

  get totalPages(): number {
    return Math.max(
      Math.ceil(
        this.transactions.length /
          this.pageSize,
      ),
      1,
    );
  }

  get paginatedTransactions(): Transaction[] {
    const start =
      (this.currentPage - 1) *
      this.pageSize;

    return this.transactions.slice(
      start,
      start + this.pageSize,
    );
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  get hasNextPage(): boolean {
    return (
      this.currentPage <
      this.totalPages
    );
  }

  get selectedDashboardInvestorName(): string {
    if (
      this.dashboardInvestorId ===
      'ALL'
    ) {
      return 'Todos los inversionistas';
    }

    return (
      this.investors.find(
        investor =>
          investor.id ===
          this.dashboardInvestorId,
      )?.name ??
      'Inversionista'
    );
  }

  onDashboardInvestorChange(): void {
    this.currentPage = 1;

    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;

    const investorId =
      this.dashboardInvestorId ===
      'ALL'
        ? undefined
        : this.dashboardInvestorId;

    this.transactionsService
      .findAll(investorId)
      .subscribe({
        next: transactions => {
          this.transactions =
            transactions ?? [];

          this.currentPage = 1;

          this.calculateSummary();

          this.finishLoading();
        },

        error: error => {
          console.error(
            'Error cargando transacciones:',
            error,
          );

          this.transactions = [];

          this.resetSummary();

          this.finishLoading();
        },
      });
  }

  submit(): void {
    if (
      !this.selectedInvestorId ||
      !this.amount ||
      this.amount <= 0 ||
      this.saving
    ) {
      return;
    }

    this.saving = true;

    this.transactionsService
      .create({
        user_id:
          this.selectedInvestorId,
        type:
          this.transactionType,
        amount:
          this.amount,
        description:
          this.description.trim() ||
          undefined,
      })
      .subscribe({
        next: () => {
          this.resetForm();

          this.saving = false;

          this.loadTransactions();
        },

        error: error => {
          console.error(
            'Error guardando movimiento:',
            error,
          );

          this.saving = false;

          this.cdr.markForCheck();
        },
      });
  }

  previousPage(): void {
    if (
      !this.hasPreviousPage
    ) {
      return;
    }

    this.currentPage--;
  }

  nextPage(): void {
    if (
      !this.hasNextPage
    ) {
      return;
    }

    this.currentPage++;
  }

  getInvestorName(
    userId: string,
  ): string {
    return (
      this.investors.find(
        investor =>
          investor.id === userId,
      )?.name ??
      userId
    );
  }

  private calculateSummary(): void {
    const summary =
      this.transactions.reduce(
        (acc, transaction) => {
          if (
            transaction.type ===
            'INVESTMENT'
          ) {
            acc.invested +=
              Number(
                transaction.amount,
              );
          }

          if (
            transaction.type ===
            'RETURN'
          ) {
            acc.returned +=
              Number(
                transaction.capital,
              );

            acc.profit +=
              Number(
                transaction.profit,
              );
          }

          return acc;
        },
        {
          invested: 0,
          returned: 0,
          profit: 0,
        },
      );

    this.invested =
      summary.invested;

    this.returned =
      summary.returned;

    this.profit =
      summary.profit;
  }

  private resetSummary(): void {
    this.invested = 0;
    this.returned = 0;
    this.profit = 0;
  }

  private resetForm(): void {
    this.selectedInvestorId = '';

    this.transactionType =
      'INVESTMENT';

    this.amount = null;
    this.description = '';
  }

  private finishLoading(): void {
    this.loading = false;

    this.cdr.markForCheck();
  }
}