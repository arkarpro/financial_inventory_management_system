import PagePlaceholder from '../components/PagePlaceholder';
import {
  BookOpen,
  ArrowLeftRight,
  Users,
  Boxes,
  FolderKanban,
  ScrollText,
  ShoppingCart,
  FileText,
  PackagePlus,
  PackageMinus,
  Move3d,
  Scale,
  BarChart3,
  TrendingUp,
  ClipboardList,
  Landmark,
  BookCopy,
  FileSpreadsheet,
  Receipt,
} from 'lucide-react';

export function ExchangeRatesPage() {
  return <PagePlaceholder title="Exchange Rates" description="Configure and update multi-currency exchange rates for international transactions." icon={ArrowLeftRight} />;
}

export function PartiesPage() {
  return <PagePlaceholder title="Customers & Vendors Directory" description="Manage your customer and vendor master records, including contact details and outstanding balances." icon={Users} />;
}

export function ProductsPage() {
  return <PagePlaceholder title="Products / Items Master" description="Maintain your product catalog with SKUs, pricing, categories, and stock reorder levels." icon={Boxes} />;
}

export function ProjectsPage() {
  return <PagePlaceholder title="Projects / Cost Centers" description="Set up project codes and cost centers to track expenses and budgets across initiatives." icon={FolderKanban} />;
}

export function JournalVouchersPage() {
  return <PagePlaceholder title="Journal Vouchers" description="Create and post manual journal entries with debit/credit line items for adjustments and accruals." icon={ScrollText} />;
}

export function PurchaseOrdersPage() {
  return <PagePlaceholder title="Purchase Orders & Bills Payable" description="Create purchase orders, track vendor deliveries, and manage bills payable." icon={ShoppingCart} />;
}

export function SalesInvoicesPage() {
  return <PagePlaceholder title="Sales Invoices & Accounts Receivable" description="Generate customer invoices, track payments, and manage your accounts receivable aging." icon={FileText} />;
}

export function GoodsReceiptPage() {
  return <PagePlaceholder title="Goods Receipt" description="Record inbound inventory from purchase orders with quantity verification and warehouse assignment." icon={PackagePlus} />;
}

export function GoodsIssuePage() {
  return <PagePlaceholder title="Goods Issue" description="Process outbound inventory for sales invoices and internal consumption with stock deductions." icon={PackageMinus} />;
}

export function InventoryMovementsPage() {
  return <PagePlaceholder title="Inventory Movements" description="View the complete stock ledger with all inbound, outbound, and transfer movements." icon={Move3d} />;
}

export function StockBalancePage() {
  return <PagePlaceholder title="Real-time Stock Balance" description="Monitor current stock levels across warehouses with valuation and reorder alerts." icon={Scale} />;
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
