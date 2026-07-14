// src/pages/InvoicePage.tsx

// ==========================================
// ၁။ လိုအပ်သော Packages များကို ခေါ်ယူခြင်း
// ==========================================
import { useState, useEffect } from 'react';
import { Plus, Search, X, Pencil, Trash2, FileText, Printer, ArrowLeft } from 'lucide-react';

export default function InvoicePage() {
  // 🌟 Google Sheet အမည် နှင့် Web App URL
  const SHEET_NAME = '6_Accounts_Receivable';
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzIhbs0Wnhc-I1bjPicNUu5sxlhV86fC9gzNwDr2cl5gbntk1Zvf6JH36JoKogjLODy/exec';

  // ==========================================
  // ၂။ State များ ကြေညာခြင်း
  // ==========================================
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View State: 'list' (ဇယားကြည့်ရန်) သို့မဟုတ် 'form' (Invoice ဖြည့်ရန်)
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete Confirmation States
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Form တွင် အသုံးပြုမည့် မူလ Data ပုံစံ (Columns ၁၉ ခု)
  const initialForm = {
    Invoice_No: '',
    Invoice_Date: new Date().toISOString().split('T')[0],
    Due_Date: '',
    Customer_ID: '',
    Customer_Name: '',
    Project_Code: '',
    Ref_No: '',
    Product_ID: '',
    Description: '',
    Quantity: '',
    Unit_Price: '',
    Currency: 'USD',
    Exchange_Rate: '1',
    Subtotal: '0',
    Discount: '0',
    Tax_Amount: '0',
    Grand_Total: '0',
    Payment_Status: 'Unpaid',
    Remarks: ''
  };

  const [formData, setFormData] = useState(initialForm);

  // ==========================================
  // ၃။ Data ဆွဲယူခြင်း နှင့် API Functions
  // ==========================================
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${WEB_APP_URL}?action=read&sheet=${SHEET_NAME}`);
      const result = await response.json();
      if (result.status === 'success') {
        setInvoices(result.data);
      }
    } catch (err) {
      setError("စာရင်းများ ရယူရာတွင် အခက်အခဲရှိနေပါသည်။");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // ==========================================
  // ၄။ Form Actions (Input Change & Submit)
  // ==========================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-Calculation (Subtotal & Grand Total တွက်ချက်ခြင်း)
      if (['Quantity', 'Unit_Price', 'Discount', 'Tax_Amount'].includes(name)) {
        const qty = parseFloat(newData.Quantity) || 0;
        const price = parseFloat(newData.Unit_Price) || 0;
        const subtotal = qty * price;
        newData.Subtotal = subtotal.toFixed(2);

        const discount = parseFloat(newData.Discount) || 0;
        const tax = parseFloat(newData.Tax_Amount) || 0;
        newData.Grand_Total = (subtotal - discount + tax).toFixed(2);
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = editingRow 
        ? { action: 'update', sheet: SHEET_NAME, data: { ...formData, _rowIndex: editingRow._rowIndex } }
        : { action: 'write', sheet: SHEET_NAME, data: formData };

      const response = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        setView('list');
        setEditingRow(null);
        setFormData(initialForm);
        fetchInvoices();
      } else {
        alert("သိမ်းဆည်းရာတွင် အမှားအယွင်းရှိပါသည်။");
      }
    } catch (err) {
      alert("ဒေတာ သိမ်းဆည်းရာတွင် အခက်အခဲရှိပါသည်။");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // ၅။ Delete Action
  // ==========================================
  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    setIsDeleting(true);
    try {
      const response = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', sheet: SHEET_NAME, id: deleteConfirmId })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setInvoices(prev => prev.filter(i => i._rowIndex !== deleteConfirmId));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      alert("ဒေတာ ဖျက်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // ၆။ Navigation & Filters
  // ==========================================
  const openEditForm = (invoice: any) => {
    setEditingRow(invoice);
    setFormData({
      Invoice_No: invoice.Invoice_No || '',
      Invoice_Date: invoice.Invoice_Date || '',
      Due_Date: invoice.Due_Date || '',
      Customer_ID: invoice.Customer_ID || '',
      Customer_Name: invoice.Customer_Name || '',
      Project_Code: invoice.Project_Code || '',
      Ref_No: invoice.Ref_No || '',
      Product_ID: invoice.Product_ID || '',
      Description: invoice.Description || '',
      Quantity: invoice.Quantity || '',
      Unit_Price: invoice.Unit_Price || '',
      Currency: invoice.Currency || 'USD',
      Exchange_Rate: invoice.Exchange_Rate || '1',
      Subtotal: invoice.Subtotal || '0',
      Discount: invoice.Discount || '0',
      Tax_Amount: invoice.Tax_Amount || '0',
      Grand_Total: invoice.Grand_Total || '0',
      Payment_Status: invoice.Payment_Status || 'Unpaid',
      Remarks: invoice.Remarks || ''
    });
    setView('form');
  };

  const openAddForm = () => {
    setEditingRow(null);
    setFormData(initialForm);
    setView('form');
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (inv.Invoice_No?.toLowerCase() || '').includes(query) ||
      (inv.Customer_Name?.toLowerCase() || '').includes(query) ||
      (inv.Project_Code?.toLowerCase() || '').includes(query)
    );
  });

  // ==========================================
  // ၇။ UI Render အပိုင်း (List View)
  // ==========================================
  if (view === 'list') {
    return (
      <div className="space-y-6 relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Accounts Receivable (Invoices)</h2>
              <p className="text-sm text-slate-500">Manage customer invoices and track payments.</p>
            </div>
          </div>
          <button onClick={openAddForm} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-700 shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" placeholder="Search by Invoice No, Customer, Project..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Project / Ref</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {isLoading && invoices.length === 0 ? (
                   <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading invoices...</td></tr>
                ) : filteredInvoices.length === 0 ? (
                   <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No invoices found.</td></tr>
                ) : (
                  filteredInvoices.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">{inv.Invoice_No}</td>
                      <td className="px-4 py-3 text-xs">{inv.Invoice_Date}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{inv.Customer_Name}</td>
                      <td className="px-4 py-3 text-xs">
                        <div className="text-slate-600">{inv.Project_Code || '-'}</div>
                        <div className="text-slate-400">Ref: {inv.Ref_No || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600">
                        {inv.Currency} {inv.Grand_Total ? Number(inv.Grand_Total).toLocaleString() : '0.00'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${inv.Payment_Status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                            inv.Payment_Status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {inv.Payment_Status || 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button onClick={() => openEditForm(inv)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                          <Pencil className="w-4 h-4"/>
                        </button>
                        <button onClick={() => setDeleteConfirmId(inv._rowIndex)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 text-center">
              <Trash2 className="w-12 h-12 text-rose-500 mx-auto mb-4 bg-rose-50 p-2 rounded-full" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Invoice?</h3>
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this invoice? This action cannot be undone.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-70">
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // ၈။ UI Render အပိုင်း (Invoice Form View)
  // ==========================================
  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-70">
            {isSubmitting ? 'Saving...' : (editingRow ? 'Update Invoice' : 'Save Invoice')}
          </button>
        </div>
      </div>

      {/* 🧾 Printable Invoice Form (Mimicking the Image Design) */}
      <div className="max-w-5xl mx-auto bg-white p-10 border border-slate-200 shadow-lg print:shadow-none print:border-none print:p-0">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <img src="/images/tis_logo.png" alt="The Insights Solution Logo" className="h-24 object-contain" />
          </div>
          <div className="text-right text-[#003399]"> {/* Standard Blue Color matched from image concept */}
            <h1 className="text-3xl font-bold tracking-wider mb-1">INVOICE</h1>
            <h2 className="text-xl font-bold">The Insights Solution</h2>
            <p className="text-xs">No. 45, Tech Park Avenue, Hlaing Township, Yangon</p>
            <p className="text-xs">Tel : +95 9 123456789, +95 9 987654321</p>
            <p className="text-xs">Email : info@theinsightssolution.com</p>
            <div className="mt-2 flex items-center justify-end gap-2 text-sm font-bold">
              <span>INVOICE NO:</span>
              <input type="text" name="Invoice_No" value={formData.Invoice_No} onChange={handleInputChange} placeholder="IN-2600200" className="w-32 border-b border-slate-300 focus:outline-none focus:border-brand-500 text-right print:border-none" />
            </div>
          </div>
        </div>

        {/* Red Divider */}
        <div className="border-t-2 border-red-500 mb-6"></div>

        {/* Customer & Document Details Section */}
        <div className="flex justify-between items-start mb-8 text-sm">
          {/* Left Side: Customer Info */}
          <div className="space-y-2 w-1/2 pr-4">
            <div className="flex">
              <span className="font-bold w-32 shrink-0">CUSTOMER ID</span>
              <span className="mr-2">:</span>
              <input type="text" name="Customer_ID" value={formData.Customer_ID} onChange={handleInputChange} className="flex-1 text-[#003399] font-bold border-b border-dashed border-slate-200 focus:outline-none focus:border-brand-500 print:border-none" />
            </div>
            <div className="flex">
              <span className="font-bold w-32 shrink-0">NAME</span>
              <span className="mr-2">:</span>
              <input type="text" name="Customer_Name" value={formData.Customer_Name} onChange={handleInputChange} className="flex-1 text-[#003399] font-bold border-b border-dashed border-slate-200 focus:outline-none focus:border-brand-500 print:border-none" />
            </div>
            <div className="pt-2">
              <span className="font-bold block mb-1">BILLING ADDRESS</span>
              {/* Note: Standard Sheet columns don't have separate Billing Address, we map it via Customer Master later or type manually */}
              <textarea placeholder="Address details..." rows={2} className="w-full text-xs border border-dashed border-slate-200 p-1 focus:outline-none focus:border-brand-500 resize-none print:border-none print:p-0"></textarea>
            </div>
          </div>

          {/* Right Side: Dates & Refs */}
          <div className="space-y-2 w-1/2 pl-4 text-right">
            <div className="flex justify-end items-center">
              <span className="font-bold mr-4">DATE</span>
              <input type="date" name="Invoice_Date" value={formData.Invoice_Date} onChange={handleInputChange} className="w-32 text-right border-b border-dashed border-slate-200 focus:outline-none focus:border-brand-500 print:border-none" />
            </div>
            <div className="flex justify-end items-center">
              <span className="font-bold mr-4">PAYMENT DUE DATE</span>
              <input type="date" name="Due_Date" value={formData.Due_Date} onChange={handleInputChange} className="w-32 text-right border-b border-dashed border-slate-200 focus:outline-none focus:border-brand-500 print:border-none" />
            </div>
            <div className="flex justify-end items-center pt-2">
              <span className="font-bold mr-4">YOU REF NO.</span>
              <input type="text" name="Ref_No" value={formData.Ref_No} onChange={handleInputChange} className="w-48 text-right border-b border-dashed border-slate-200 focus:outline-none focus:border-brand-500 print:border-none" />
            </div>
            <div className="flex justify-end items-center">
              <span className="font-bold mr-4">PROJECT NAME</span>
              <input type="text" name="Project_Code" value={formData.Project_Code} onChange={handleInputChange} className="w-48 text-right border-b border-dashed border-slate-200 focus:outline-none focus:border-brand-500 print:border-none" />
            </div>
            {/* Status Dropdown (Hidden on Print) */}
            <div className="flex justify-end items-center pt-2 print:hidden">
              <span className="font-bold mr-4 text-slate-500">PAYMENT STATUS</span>
              <select name="Payment_Status" value={formData.Payment_Status} onChange={handleInputChange} className="w-32 text-right border border-slate-200 rounded p-1 text-xs focus:outline-none focus:border-brand-500">
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Items Table */}
        <div className="border border-black mb-6">
          <table className="w-full text-sm">
            <thead className="border-b border-black text-center text-xs">
              <tr className="divide-x divide-black">
                <th className="py-2 w-1/4 font-medium">PRODUCT ID</th>
                <th className="py-2 w-2/5 font-medium">DESCRIPTION</th>
                <th className="py-2 w-[10%] font-medium">QUANTITY</th>
                <th className="py-2 w-[15%] font-medium">U/PRICE</th>
                <th className="py-2 w-[15%] font-medium">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-x divide-black min-h-[300px] align-top">
              {/* Single Row Entry based on sheet structure */}
              <tr className="h-64">
                <td className="p-2">
                  <input type="text" name="Product_ID" value={formData.Product_ID} onChange={handleInputChange} className="w-full text-center focus:outline-none focus:bg-slate-50 print:bg-transparent" placeholder="PROD-001" />
                </td>
                <td className="p-2">
                  <textarea name="Description" value={formData.Description} onChange={handleInputChange} rows={8} className="w-full resize-none focus:outline-none focus:bg-slate-50 print:bg-transparent" placeholder="Item description here..."></textarea>
                </td>
                <td className="p-2">
                  <input type="number" step="any" name="Quantity" value={formData.Quantity} onChange={handleInputChange} className="w-full text-center focus:outline-none focus:bg-slate-50 print:bg-transparent" placeholder="1" />
                </td>
                <td className="p-2">
                  <input type="number" step="any" name="Unit_Price" value={formData.Unit_Price} onChange={handleInputChange} className="w-full text-right focus:outline-none focus:bg-slate-50 print:bg-transparent" placeholder="0.00" />
                  <select name="Currency" value={formData.Currency} onChange={handleInputChange} className="w-full mt-1 text-xs text-right text-slate-400 focus:outline-none bg-transparent print:hidden">
                    <option value="USD">USD</option>
                    <option value="MMK">MMK</option>
                    <option value="SGD">SGD</option>
                  </select>
                </td>
                <td className="p-2 text-right relative">
                  <span className="block mt-1 font-mono">{Number(formData.Subtotal).toLocaleString()}</span>
                  <div className="absolute bottom-2 right-2 text-[10px] text-slate-300 print:hidden">
                    Ex. Rate: <input type="number" name="Exchange_Rate" value={formData.Exchange_Rate} onChange={handleInputChange} className="w-12 border-b text-right focus:outline-none" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Totals & Remarks */}
        <div className="flex items-start justify-between">
          
          {/* Remarks & Bank Details */}
          <div className="w-3/5 pr-4 space-y-4">
            <div className="border border-black">
              <div className="border-b border-black px-2 py-1 text-xs font-bold bg-slate-50">REMARK</div>
              <textarea name="Remarks" value={formData.Remarks} onChange={handleInputChange} rows={3} className="w-full p-2 text-xs text-red-500 focus:outline-none resize-none print:bg-transparent" placeholder="Special instructions..."></textarea>
            </div>
            
            <div className="border border-black text-xs p-2">
              <div className="font-bold mb-2">BANK DETAILS</div>
              <div className="grid grid-cols-[120px_1fr] gap-y-1">
                <span className="font-semibold">Beneficiary Name</span>
                <span className="text-[#003399]">: THE INSIGHTS SOLUTION COMPANY LIMITED</span>
                <span className="font-semibold">Bank</span>
                <span>: KBZ Bank / AYA Bank</span>
                <span className="font-semibold">SWIFT Address</span>
                <span>: KBAZMMMY / AYABMMMY</span>
                <span className="font-semibold">Bank Address</span>
                <span>: Yangon, Myanmar</span>
              </div>
            </div>
          </div>

          {/* Totals Box */}
          <div className="w-2/5">
            <table className="w-full text-sm font-bold text-right border-collapse">
              <tbody>
                <tr>
                  <td className="py-1 pr-4 w-1/2">SUB TOTAL</td>
                  <td className="py-1 w-12 text-center text-slate-500">{formData.Currency}</td>
                  <td className="py-1 border border-black px-2 w-1/3 bg-slate-50">{Number(formData.Subtotal).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">DISCOUNT</td>
                  <td className="py-1 text-center text-slate-500">{formData.Currency}</td>
                  <td className="py-1 border border-black px-2">
                    <input type="number" step="any" name="Discount" value={formData.Discount} onChange={handleInputChange} className="w-full text-right focus:outline-none print:bg-transparent" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">TAX</td>
                  <td className="py-1 text-center text-slate-500">{formData.Currency}</td>
                  <td className="py-1 border border-black px-2">
                    <input type="number" step="any" name="Tax_Amount" value={formData.Tax_Amount} onChange={handleInputChange} className="w-full text-right focus:outline-none print:bg-transparent" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">GRAND TOTAL</td>
                  <td className="py-1 text-center text-slate-500">{formData.Currency}</td>
                  <td className="py-1 border border-black px-2 bg-slate-100">{Number(formData.Grand_Total).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* Signature Area */}
            <div className="mt-16 text-center text-[#003399] font-bold text-sm">
              <p>The Insights Solution</p>
              <div className="mt-8 border-t border-[#003399] w-48 mx-auto pt-1">
                Authorized Signature
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}