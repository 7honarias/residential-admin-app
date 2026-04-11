export type ExpenseStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface IExpense {
  id: string;
  supplierName: string;
  categoryName: string;
  invoiceNumber?: string;
  issueDate: string;
  dueDate: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  status: ExpenseStatus;
}