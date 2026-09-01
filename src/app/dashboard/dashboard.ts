import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Transaction {
  id: string;
  type: 'INVESTMENT' | 'RETURN';
  amount: number;
  capital: number;
  profit: number;
  description?: string;
  createdAt: Date;
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
export class Dashboard {
  invested = 35000;
  returned = 10000;
  profit = 2000;

  transactionType: 'INVESTMENT' | 'RETURN' = 'INVESTMENT';

  amount: number | null = null;
  capital: number | null = null;
  transactionProfit: number | null = null;
  description = '';

  transactions: Transaction[] = [
    {
      id: '1',
      type: 'RETURN',
      amount: 12000,
      capital: 10000,
      profit: 2000,
      description: 'Retorno de agosto',
      createdAt: new Date(),
    },
    {
      id: '2',
      type: 'INVESTMENT',
      amount: 35000,
      capital: 35000,
      profit: 0,
      description: 'Inversión inicial',
      createdAt: new Date(),
    },
  ];

  get balanceToReturn(): number {
    return this.invested - this.returned;
  }

  get isReturn(): boolean {
    return this.transactionType === 'RETURN';
  }

  submit(): void {
    console.log({
      type: this.transactionType,
      amount: this.amount,
      capital: this.capital,
      profit: this.transactionProfit,
      description: this.description,
    });
  }
}