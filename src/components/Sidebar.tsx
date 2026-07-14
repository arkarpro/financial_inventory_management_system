// src/components/Sidebar.tsx

// ==========================================
// ၁။ လိုအပ်သော Packages များနှင့် Icons များ ခေါ်ယူခြင်း
// ==========================================
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  FileText,
  Landmark,
  BookOpen,
  Users,
  Boxes,
  FolderKanban,
  Receipt,
  ClipboardList,
  ShoppingCart,
  FileSpreadsheet,
  PackagePlus,
  PackageMinus,
  Move3d,
  Scale,
  Wallet,
  TrendingUp,
  ScrollText,
  BookCopy,
  X,
  Briefcase,
  ArrowRightLeft
} from 'lucide-react';

// ==========================================
// ၂။ Sidebar တွင် ပေါ်မည့် Menu စာရင်းများ
// ==========================================
interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Master Data',
    items: [
      { label: 'Chart of Accounts', path: '/master/chart-of-accounts', icon: BookOpen },
      { label: 'Exchange Rates', path: '/master/exchange-rates', icon: ArrowLeftRight },
      { label: 'Customers & Vendors', path: '/master/customers-vendors', icon: Users },
      { label: 'Fixed Assets', path: '/master/fixed-assets', icon: Briefcase },
      { label: 'Products / Items', path: '/master/products', icon: Boxes },
      { label: 'Projects / Cost Centers', path: '/master/projects', icon: FolderKanban },
    ],
  },
  {
    title: 'Transactions',
    items: [
      { label: 'Cash & Bank', path: '/transactions/cash-bank', icon: Wallet },
      { label: 'Journal Vouchers', path: '/transactions/journal-vouchers', icon: ScrollText },
      { label: 'Purchase Orders', path: '/transactions/purchase-orders', icon: ShoppingCart },
      { label: 'Sales Invoices (AR)', path: '/transactions/sales-invoices', icon: FileText },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Goods Receipt', path: '/inventory/goods-receipt', icon: PackagePlus },
      { label: 'Goods Issue', path: '/inventory/goods-issue', icon: PackageMinus },
      { label: 'Stock Movements', path: '/inventory/movements', icon: ArrowRightLeft },
      { label: 'Stock Balance', path: '/inventory/stock-balance', icon: Scale },
    ],
  },
  {
    title: 'Dashboards',
    items: [
      { label: 'AP Summary', path: '/dashboards/ap-summary', icon: BarChart3 },
      { label: 'AR Summary', path: '/dashboards/ar-summary', icon: TrendingUp },
      { label: 'JV Summary', path: '/dashboards/jv-summary', icon: ClipboardList },
      { label: 'Cash & Bank Register', path: '/dashboards/cash-bank-register', icon: Landmark },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'General Ledger', path: '/reports/general-ledger', icon: BookCopy },
      { label: 'Trial Balance', path: '/reports/trial-balance', icon: FileSpreadsheet },
      { label: 'Profit & Loss', path: '/reports/profit-loss', icon: BarChart3 },
      { label: 'Balance Sheet', path: '/reports/balance-sheet', icon: Receipt },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center p-1 shadow-lg">
              <img src="/images/tis_logo.png" alt="TIS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none tracking-tight">TIS Academy</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Financial System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`
                    }
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Section */}
        <div className="px-3 py-4 border-t border-slate-700/50">
          <div className="flex items-center justify-center text-[11px] text-slate-500 tracking-wider">
            &copy; {new Date().getFullYear()} TIS Academy.
          </div>
        </div>
      </aside>
    </>
  );
}