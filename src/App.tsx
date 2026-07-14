// ==========================================
// ၁။ လိုအပ်သော Pages နှင့် Services များကို ခေါ်ယူခြင်း
// ==========================================
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Auth
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// Pages
import Dashboard from './pages/Dashboard';
import ChartOfAccountsPage from './pages/ChartOfAccountsPage';
import ExchangeRates from './pages/ExchangeRates';
import CustomersVendors from './pages/CustomersVendors';
import FixedAssets from './pages/FixedAssets';
import ProductsPage from './pages/ProductsPage';
import ProjectsPage from './pages/ProjectsPage'; // 🟢 အသစ်
import CashBankPage from './pages/CashBankPage';
import JournalVouchersPage from './pages/JournalVouchersPage';
import PurchaseOrdersPage from './pages/PayablePage';
import InvoicePage from './pages/InvoicePage';
import GoodsReceiptPage from './pages/GoodsReceiptPage'; // 🟢 အသစ်
import GoodsIssuePage from './pages/GoodsIssuePage';     // 🟢 အသစ်
import InventoryMovementsPage from './pages/InventoryMovementsPage'; // 🟢 အသစ်
import StockBalancePage from './pages/StockBalancePage'; // 🟢 အသစ်

// Placeholder Pages (အကယ်၍ အချို့ဖိုင်များ မရှိသေးပါက Placeholder ကို သုံးပါ)
import { APSummaryPage, ARSummaryPage, JVSummaryPage, CashBankRegisterPage, GeneralLedgerPage, TrialBalancePage, ProfitLossPage, BalanceSheetPage } from './pages/PlaceholderPages';

export default function App() {
  // ==========================================
  // ၂။ Login User State ထိန်းသိမ်းခြင်း
  // ==========================================
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // ==========================================
  // ၃။ Routing နှင့် Layout တည်ဆောက်ခြင်း
  // ==========================================
  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout user={currentUser} onLogout={() => setCurrentUser(null)} />}>
          
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />

          {/* ========================================== */}
          {/* ၄။ စာမျက်နှာ လမ်းကြောင်းများ (Routes) */}
          {/* ========================================== */}
          
          {/* ၄.၁ Master Data အပိုင်း */}
          <Route path="/master/chart-of-accounts" element={<ChartOfAccountsPage />} />
          <Route path="/master/exchange-rates" element={<ExchangeRates />} />
          <Route path="/master/customers-vendors" element={<CustomersVendors />} />
          <Route path="/master/fixed-assets" element={<FixedAssets />} />
          <Route path="/master/products" element={<ProductsPage />} />
          <Route path="/master/projects" element={<ProjectsPage />} />

          {/* ၄.၂ Transactions အပိုင်း */}
          <Route path="/transactions/cash-bank" element={<CashBankPage />} />
          <Route path="/transactions/journal-vouchers" element={<JournalVouchersPage />} />
          <Route path="/transactions/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/transactions/sales-invoices" element={<InvoicePage />} />

          {/* ၄.၃ Inventory အပိုင်း */}
          <Route path="/inventory/goods-receipt" element={<GoodsReceiptPage />} />
          <Route path="/inventory/goods-issue" element={<GoodsIssuePage />} />
          <Route path="/inventory/movements" element={<InventoryMovementsPage />} />
          <Route path="/inventory/stock-balance" element={<StockBalancePage />} />

          {/* ၄.၄ Dashboards & Reports */}
          <Route path="/dashboards/ap-summary" element={<APSummaryPage />} />
          <Route path="/dashboards/ar-summary" element={<ARSummaryPage />} />
          <Route path="/dashboards/jv-summary" element={<JVSummaryPage />} />
          <Route path="/dashboards/cash-bank-register" element={<CashBankRegisterPage />} />
          <Route path="/reports/general-ledger" element={<GeneralLedgerPage />} />
          <Route path="/reports/trial-balance" element={<TrialBalancePage />} />
          <Route path="/reports/profit-loss" element={<ProfitLossPage />} />
          <Route path="/reports/balance-sheet" element={<BalanceSheetPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}