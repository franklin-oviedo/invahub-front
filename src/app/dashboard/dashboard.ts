import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { PendingInvestment, Transaction, TransactionType } from '../../utils/transaction.model';

import { TransactionsService } from '../../utils/transactions.service';

interface Investor {
  id: string;
  name: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  readonly maxVoucherSize = 5 * 1024 * 1024;

  readonly allowedVoucherTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  selectedInvestorId = '';
  selectedInvestmentId = '';
  dashboardInvestorId = 'ALL';

  transactionType: TransactionType = 'INVESTMENT';

  amount: number | null = null;
  description = '';

  selectedVoucher: File | null = null;

  voucherError = '';

  previewingVoucherId: string | null = null;

  voucherPreviewUrl: string | null = null;

  voucherPreviewSafeUrl: SafeResourceUrl | null = null;

  voucherPreviewType: 'IMAGE' | 'PDF' | null = null;

  transactions: Transaction[] = [];

  pendingInvestments: PendingInvestment[] = [];

  invested = 0;
  returned = 0;
  profit = 0;

  loading = false;
  saving = false;
  loadingInvestments = false;

  currentPage = 1;

  readonly pageSize = 5;

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  get balanceToReturn(): number {
    return Math.max(this.invested - this.returned, 0);
  }

  get totalPages(): number {
    return Math.max(Math.ceil(this.transactions.length / this.pageSize), 1);
  }

  get paginatedTransactions(): Transaction[] {
    const start = (this.currentPage - 1) * this.pageSize;

    return this.transactions.slice(start, start + this.pageSize);
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  get isReturn(): boolean {
    return this.transactionType === 'RETURN';
  }

  get selectedDashboardInvestorName(): string {
    if (this.dashboardInvestorId === 'ALL') {
      return 'Todos los inversionistas';
    }

    return (
      this.investors.find((investor) => investor.id === this.dashboardInvestorId)?.name ??
      'Inversionista'
    );
  }

  onDashboardInvestorChange(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  onInvestorChange(): void {
    this.selectedInvestmentId = '';
    this.pendingInvestments = [];

    if (this.isReturn) {
      this.loadPendingInvestments();
    }
  }

  onTransactionTypeChange(): void {
    this.selectedInvestmentId = '';
    this.pendingInvestments = [];

    if (this.isReturn && this.selectedInvestorId) {
      this.loadPendingInvestments();
    }
  }

  onVoucherSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    this.selectedVoucher = null;
    this.voucherError = '';

    if (!file) {
      return;
    }

    if (!this.allowedVoucherTypes.includes(file.type)) {
      this.voucherError = 'Formato no permitido. Usa JPG, JPEG, PNG, WEBP o PDF.';

      input.value = '';

      this.cdr.markForCheck();

      return;
    }

    if (file.size > this.maxVoucherSize) {
      this.voucherError = 'El comprobante no puede superar los 5 MB.';

      input.value = '';

      this.cdr.markForCheck();

      return;
    }

    this.selectedVoucher = file;

    this.cdr.markForCheck();
  }

  previewVoucher(transaction: Transaction): void {
    if (!transaction.voucher_path || this.previewingVoucherId) {
      return;
    }

    this.previewingVoucherId = transaction.id;

    this.transactionsService.getVoucherUrl(transaction.id).subscribe({
      next: (response) => {
        this.voucherPreviewUrl = response.url;

        this.voucherPreviewType = this.getVoucherType(transaction.voucher_path);

        if (this.voucherPreviewType === 'PDF') {
          this.voucherPreviewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.url);
        } else {
          this.voucherPreviewSafeUrl = null;
        }

        this.previewingVoucherId = null;

        document.body.classList.add('voucher-modal-open');

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error cargando comprobante:', error);

        this.previewingVoucherId = null;

        this.cdr.markForCheck();
      },
    });
  }

  closeVoucherPreview(): void {
    this.voucherPreviewUrl = null;
    this.voucherPreviewSafeUrl = null;
    this.voucherPreviewType = null;

    document.body.classList.remove('voucher-modal-open');

    this.cdr.markForCheck();
  }

  loadTransactions(): void {
    this.loading = true;

    const investorId = this.dashboardInvestorId === 'ALL' ? undefined : this.dashboardInvestorId;

    this.transactionsService.findAll(investorId).subscribe({
      next: (transactions) => {
        this.transactions = transactions ?? [];

        this.currentPage = 1;

        this.calculateSummary();

        this.finishLoading();
      },
      error: (error) => {
        console.error('Error cargando transacciones:', error);

        this.transactions = [];

        this.resetSummary();

        this.finishLoading();
      },
    });
  }

  loadPendingInvestments(): void {
    if (!this.selectedInvestorId) {
      this.pendingInvestments = [];
      return;
    }

    this.loadingInvestments = true;

    this.transactionsService.findPendingInvestments(this.selectedInvestorId).subscribe({
      next: (investments) => {
        this.pendingInvestments = investments ?? [];

        this.loadingInvestments = false;

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error cargando inversiones pendientes:', error);

        this.pendingInvestments = [];

        this.loadingInvestments = false;

        this.cdr.markForCheck();
      },
    });
  }

  submit(): void {
    if (
      !this.selectedInvestorId ||
      !this.amount ||
      this.amount <= 0 ||
      !this.selectedVoucher ||
      this.saving
    ) {
      return;
    }

    if (this.isReturn && !this.selectedInvestmentId) {
      return;
    }

    this.saving = true;

    this.transactionsService
      .create({
        user_id: this.selectedInvestorId,
        type: this.transactionType,
        amount: this.amount,
        voucher: this.selectedVoucher,
        investment_id: this.isReturn ? this.selectedInvestmentId : undefined,
        description: this.description.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.resetForm();

          this.saving = false;

          this.loadTransactions();
        },
        error: (error) => {
          console.error('Error guardando movimiento:', error);

          this.saving = false;

          this.cdr.markForCheck();
        },
      });
  }

  previousPage(): void {
    if (!this.hasPreviousPage) {
      return;
    }

    this.currentPage--;
  }

  nextPage(): void {
    if (!this.hasNextPage) {
      return;
    }

    this.currentPage++;
  }

  getInvestorName(userId: string): string {
    return this.investors.find((investor) => investor.id === userId)?.name ?? userId;
  }

  private getVoucherType(path: string): 'IMAGE' | 'PDF' {
    const extension = path.split('.').pop()?.toLowerCase();

    return extension === 'pdf' ? 'PDF' : 'IMAGE';
  }

  private calculateSummary(): void {
    const summary = this.transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'INVESTMENT') {
          acc.invested += Number(transaction.amount);
        }

        if (transaction.type === 'RETURN') {
          acc.returned += Number(transaction.capital);

          acc.profit += Number(transaction.profit);
        }

        return acc;
      },
      {
        invested: 0,
        returned: 0,
        profit: 0,
      },
    );

    this.invested = summary.invested;

    this.returned = summary.returned;

    this.profit = summary.profit;
  }

  private resetSummary(): void {
    this.invested = 0;
    this.returned = 0;
    this.profit = 0;
  }

  private resetForm(): void {
    this.selectedInvestorId = '';
    this.selectedInvestmentId = '';

    this.transactionType = 'INVESTMENT';

    this.amount = null;
    this.description = '';

    this.selectedVoucher = null;
    this.voucherError = '';

    this.pendingInvestments = [];
  }

  private finishLoading(): void {
    this.loading = false;

    this.cdr.markForCheck();
  }
}
