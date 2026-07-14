import PagePlaceholder from '../components/PagePlaceholder';
import {
  ShoppingCart,
  BarChart3,
  TrendingUp,
  ClipboardList,
  Landmark,
  BookCopy,
  FileSpreadsheet,
  Receipt,
} from 'lucide-react';

export function PurchaseOrdersPage() {
  return <PagePlaceholder title="Purchase Orders & Bills Payable" description="Create purchase orders, track vendor deliveries, and manage bills payable." icon={ShoppingCart} />;
}

export function APSummaryPage() {
  return <PagePlaceholder title="Accounts Payable Summary" description="Analyze your payables with aging buckets, vendor breakdowns, and payment schedules." icon={BarChart3} />;
}

export function ARSummaryPage() {
  return <PagePlaceholder title="Accounts Receivable Summary" description="Track receivables with aging analysis, customer breakdowns, and collection forecasts." icon={TrendingUp} />;
}

export function JVSummaryPage() {
  return <PagePlaceholder title="Journal Voucher Summary" description="Review all posted journal entries with drill-down into individual debit/credit lines." icon={ClipboardList} />;
}

export function CashBankRegisterPage() {
  return <PagePlaceholder title="Cash & Bank Register" description="Consolidated view of all cash and bank transactions with reconciliation status." icon={Landmark} />;
}

export function GeneralLedgerPage() {
  return <PagePlaceholder title="General Ledger" description="Consolidated transaction history across all accounts with filtering by date, account, and reference." icon={BookCopy} />;
}

export function TrialBalancePage() {
  return <PagePlaceholder title="Trial Balance" description="Verify that total debits equal total credits with a detailed account-by-account breakdown." icon={FileSpreadsheet} />;
}

export function ProfitLossPage() {
  return <PagePlaceholder title="Profit & Loss Statement" description="View your income statement showing revenue, cost of goods sold, and operating expenses." icon={BarChart3} />;
}

export function BalanceSheetPage() {
  return <PagePlaceholder title="Balance Sheet" description="Review your financial position with assets, liabilities, and equity at a point in time." icon={Receipt} />;
}