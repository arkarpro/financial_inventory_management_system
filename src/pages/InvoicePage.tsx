// src/pages/InvoicePage.tsx

import { useState, useEffect } from 'react';
import { Plus, Search, X, Pencil, Trash2, FileText, Printer, ArrowLeft, RefreshCw } from 'lucide-react';

export default function InvoicePage() {
  const SHEET_NAME = '6_Accounts_Receivable';
  const PARTNERS_SHEET = '9_Partners';
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzIhbs0Wnhc-I1bjPicNUu5sxlhV86fC9gzNwDr2cl5gbntk1Zvf6JH36JoKogjLODy/exec';

  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add New Customer Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  
  const initialPartnerForm = {
    Partner_ID: '', Partner_Name: '', Shipping_Address: '', Billing_Address: '',
    Email_Address: '', Phone_Number: '', Contact_Person: '', Description: '',
    Total_Sales: '', Sales_Rank: '', Total_Purchases: '', Purchase_Rank: '',
    Partner_Type: 'Customer', Status: 'Active'
  };
  const [newCustomer, setNewCustomer] = useState(initialPartnerForm);

  // Editable Bank Details
  const [bankDetails, setBankDetails] = useState({
    beneficiary: 'THE INSIGHTS SOLUTION COMPANY LIMITED',
    bank: 'KBZ Bank / AYA Bank',
    swift: 'KBAZMMMY / AYABMMMY',
    address: 'Yangon, Myanmar'
  });

  const initialForm = {
    Invoice_No: '', Invoice_Date: new Date().toISOString().split('T')[0], Due_Date: '',
    Customer_ID: '', Customer_Name: '', Project_Code: '', Ref_No: '', Currency: 'USD', 
    Exchange_Rate: '1', Subtotal: '0', Discount: '0', Tax_Amount: '0', Grand_Total: '0', 
    Payment_Status: 'Unpaid', Remarks: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // 🌟 Invoice တွင် Item (၁၀) ကြောင်း ထည့်သွင်းနိုင်ရန် State
  const emptyItems = Array(10).fill({ Product_ID: '', Description: '', Quantity: '', Unit_Price: '', Amount: '0' });
  const [invoiceItems, setInvoiceItems] = useState(emptyItems);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const invRes = await fetch(`${WEB_APP_URL}?action=read&sheet=${SHEET_NAME}`);
      const invData = await invRes.json();
      if (invData.status === 'success') setInvoices(invData.data);

      const custRes = await fetch(`${WEB_APP_URL}?action=read&sheet=${PARTNERS_SHEET}`);
      const custData = await custRes.json();
      if (custData.status === 'success') {
        const filteredCustomers = custData.data.filter((c: any) => {
          const type = (c.Partner_Type || '').toLowerCase();
          return type === 'customer' || type === 'both' || type === '';
        });
        setCustomers(filteredCustomers);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate Totals whenever items, discount or tax changes
  useEffect(() => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
    const discount = parseFloat(formData.Discount) || 0;
    const tax = parseFloat(formData.Tax_Amount) || 0;
    const grandTotal = subtotal - discount + tax;

    setFormData(prev => ({
      ...prev,
      Subtotal: subtotal.toFixed(2),
      Grand_Total: grandTotal.toFixed(2)
    }));
  }, [invoiceItems, formData.Discount, formData.Tax_Amount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🌟 Item ၁၀ ကြောင်းအတွက် Change Handler
  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Amount အလိုအလျောက် တွက်ချက်ခြင်း
    if (field === 'Quantity' || field === 'Unit_Price') {
      const qty = parseFloat(newItems[index].Quantity) || 0;
      const price = parseFloat(newItems[index].Unit_Price) || 0;
      newItems[index].Amount = (qty * price).toFixed(2);
    }
    setInvoiceItems(newItems);
  };

  // 🌟 Customer ID ရိုက်ထည့် / ရွေးလိုက်သည်နှင့် Name အလိုအလျောက် ပေါ်စေရန်
  const handleCustomerIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pid = e.target.value;
    const cust = customers.find(c => c.Partner_ID === pid);
    setFormData(prev => ({
      ...prev,
      Customer_ID: pid,
      Customer_Name: cust ? cust.Partner_Name : prev.Customer_Name
    }));
  };

  const openAddCustomerModal = () => {
    const nextNumber = customers.length + 1;
    const autoId = `CUS-${String(nextNumber).padStart(3, '0')}`;
    setNewCustomer({ ...initialPartnerForm, Partner_ID: autoId });
    setIsCustomerModalOpen(true);
  };

  // 🌟 Customer Add Error ကို ဖြေရှင်းထားပါသည် (Columns အားလုံးပို့ပေးမည်)
  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCustomer(true);
    try {
      const payload = {
        action: 'write',
        sheet: PARTNERS_SHEET,
        data: newCustomer // ကော်လံ (၁၄) ခုလုံး အပြည့်အစုံပါဝင်သည်
      };
      const response = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) });
      const result = await response.json();
      if (result.status === 'success') {
        setFormData(prev => ({ ...prev, Customer_ID: newCustomer.Partner_ID, Customer_Name: newCustomer.Partner_Name }));
        setIsCustomerModalOpen(false);
        fetchData(); 
      } else {
        alert("Customer သိမ်းဆည်းရာတွင် အမှားရှိပါသည်။");
      }
    } catch (err) {
      alert("Customer သိမ်းဆည်းရာတွင် အမှားရှိပါသည်။ (Network Error)");
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 🌟 Item (၁၀) ကြောင်းအနက် ဒေတာပါသော အကြောင်းများကို စစ်ထုတ်ပြီး String တစ်ခုတည်းအဖြစ် ပေါင်းစည်းခြင်း
      const validItems = invoiceItems.filter(item => item.Product_ID || item.Description || item.Quantity);
      
      const payloadData = {
        ...formData,
        Product_ID: validItems.map(i => i.Product_ID).join('\n'),
        Description: validItems.map(i => i.Description).join('\n'),
        Quantity: validItems.map(i => i.Quantity).join('\n'),
        Unit_Price: validItems.map(i => i.Unit_Price).join('\n')
      };

      const payload = editingRow 
        ? { action: 'update', sheet: SHEET_NAME, data: { ...payloadData, _rowIndex: editingRow._rowIndex } }
        : { action: 'write', sheet: SHEET_NAME, data: payloadData };

      const response = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) });
      const result = await response.json();
      if (result.status === 'success') {
        setView('list');
        setEditingRow(null);
        setFormData(initialForm);
        setInvoiceItems(emptyItems);
        fetchData();
      } else {
        alert("သိမ်းဆည်းရာတွင် အမှားအယွင်းရှိပါသည်။");
      }
    } catch (err) {
      alert("ဒေတာ သိမ်းဆည်းရာတွင် အခက်အခဲရှိပါသည်။");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditForm = (invoice: any) => {
    setEditingRow(invoice);
    setFormData({ ...initialForm, ...invoice });

    // 🌟 String အဖြစ် သိမ်းထားသော Item များကို Arrays အဖြစ် ပြန်ခွဲထုတ်ခြင်း
    const pIds = (invoice.Product_ID || '').split('\n');
    const descs = (invoice.Description || '').split('\n');
    const qtys = (invoice.Quantity || '').split('\n');
    const prices = (invoice.Unit_Price || '').split('\n');

    const loadedItems = emptyItems.map((emptyItem, i) => {
      if (i < Math.max(pIds.length, descs.length)) {
        const q = parseFloat(qtys[i]) || 0;
        const p = parseFloat(prices[i]) || 0;
        return {
          Product_ID: pIds[i] || '',
          Description: descs[i] || '',
          Quantity: qtys[i] || '',
          Unit_Price: prices[i] || '',
          Amount: (q * p).toFixed(2)
        };
      }
      return emptyItem;
    });

    setInvoiceItems(loadedItems);
    setView('form');
  };

  const openAddForm = () => {
    setEditingRow(null);
    setFormData(initialForm);
    setInvoiceItems(emptyItems);
    setView('form');
  };

  // ... (delete & print functions remain the same)
  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    setIsDeleting(true);
    try {
      const response = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: 'delete', sheet: SHEET_NAME, id: deleteConfirmId }) });
      const result = await response.json();
      if (result.status === 'success') {
        setInvoices(prev => prev.filter(i => i._rowIndex !== deleteConfirmId));
        setDeleteConfirmId(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => window.print();

  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return ((inv.Invoice_No?.toLowerCase() || '').includes(query) || (inv.Customer_Name?.toLowerCase() || '').includes(query));
  });

  if (view === 'list') {
    return (
      <div className="space-y-6 relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-600 rounded-lg"><FileText className="w-6 h-6" /></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Sales Invoices (AR)</h2>
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
              <input type="text" placeholder="Search by Invoice No, Customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {isLoading && invoices.length === 0 ? (
                   <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading invoices...</td></tr>
                ) : filteredInvoices.length === 0 ? (
                   <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No invoices found.</td></tr>
                ) : (
                  filteredInvoices.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">{inv.Invoice_No}</td>
                      <td className="px-4 py-3 text-xs">{inv.Invoice_Date}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{inv.Customer_Name}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600">
                        {inv.Currency} {inv.Grand_Total ? Number(inv.Grand_Total).toLocaleString() : '0.00'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${inv.Payment_Status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : inv.Payment_Status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {inv.Payment_Status || 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button onClick={() => openEditForm(inv)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4"/></button>
                        <button onClick={() => setDeleteConfirmId(inv._rowIndex)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 text-center">
              <Trash2 className="w-12 h-12 text-rose-500 mx-auto mb-4 bg-rose-50 p-2 rounded-full" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Invoice?</h3>
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this invoice?</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-70">
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            header, aside, .print-hidden, nav { display: none !important; }
            main { padding: 0 !important; margin: 0 !important; background: white !important; }
            .print-container { padding: 1cm 1cm !important; width: 100% !important; border: none !important; box-shadow: none !important; }
            input, textarea, select { border: none !important; resize: none !important; outline: none !important; -webkit-appearance: none; box-shadow: none !important; }
            input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          }
        `}
      </style>

      {/* Top Action Bar */}
      <div className="print-hidden flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 flex items-center gap-2 disabled:opacity-70">
            {isSubmitting ? 'Saving...' : (editingRow ? 'Update Invoice' : 'Save Invoice')}
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="print-container max-w-5xl mx-auto bg-white p-10 border border-slate-200 shadow-lg">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div><img src="/images/tis_logo.png" alt="Logo" className="h-24 object-contain" /></div>
          <div className="text-right text-[#003399]">
            <h1 className="text-3xl font-bold tracking-wider mb-1">INVOICE</h1>
            <h2 className="text-xl font-bold">The Insights Solution</h2>
            <p className="text-xs">No. 45, Tech Park Avenue, Hlaing Township, Yangon</p>
            <p className="text-xs">Tel : +95 9 123456789, +95 9 987654321</p>
            <p className="text-xs">Email : info@theinsightssolution.com</p>
            <div className="mt-2 flex items-center justify-end gap-2 text-sm font-bold">
              <span>INVOICE NO:</span>
              <input type="text" name="Invoice_No" value={formData.Invoice_No} onChange={handleInputChange} placeholder="IN-2600200" className="w-32 border-b border-slate-300 focus:border-brand-500 text-right print:border-none outline-none" />
            </div>
          </div>
        </div>

        <div className="border-t-2 border-red-500 mb-6"></div>

        {/* Customer Info & Dates */}
        <div className="flex justify-between items-start mb-8 text-sm">
          <div className="space-y-3 w-1/2 pr-4">
            <div className="flex items-center relative">
              <span className="font-bold w-32 shrink-0">CUSTOMER ID</span>
              <span className="mr-2">:</span>
              
              {/* 🌟 Datalist for Searchable Dropdown 🌟 */}
              <input 
                list="customers" 
                name="Customer_ID" 
                value={formData.Customer_ID} 
                onChange={handleCustomerIdChange}
                placeholder="Select or Type ID"
                className="flex-1 text-[#003399] font-bold border-b border-dashed border-slate-200 bg-transparent outline-none focus:border-brand-500 print:border-none"
              />
              <datalist id="customers">
                {customers.map(c => <option key={c.Partner_ID} value={c.Partner_ID}>{c.Partner_Name}</option>)}
              </datalist>

              <div className="print-hidden flex items-center gap-1 shrink-0 ml-2">
                <button type="button" onClick={fetchData} title="Refresh" className="p-1 text-slate-400 hover:text-brand-600"><RefreshCw className="w-3 h-3" /></button>
                <button type="button" onClick={openAddCustomerModal} className="text-[10px] uppercase font-bold bg-brand-100 text-brand-700 px-2 py-1 rounded hover:bg-brand-200">+ Add</button>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="font-bold w-32 shrink-0">NAME</span>
              <span className="mr-2">:</span>
              <input type="text" name="Customer_Name" value={formData.Customer_Name} onChange={handleInputChange} className="flex-1 text-[#003399] font-bold border-b border-dashed border-slate-200 bg-transparent outline-none focus:border-brand-500 print:border-none" />
            </div>
            <div className="pt-2">
              <span className="font-bold block mb-1">BILLING ADDRESS</span>
              <textarea placeholder="Address details..." rows={2} className="w-full text-xs border border-dashed border-slate-200 p-1 bg-transparent outline-none resize-none print:border-none print:p-0"></textarea>
            </div>
          </div>

          <div className="space-y-2 w-1/2 pl-4 text-right">
            <div className="flex justify-end items-center">
              <span className="font-bold mr-4">DATE</span>
              <input type="date" name="Invoice_Date" value={formData.Invoice_Date} onChange={handleInputChange} className="w-32 text-right border-b border-dashed border-slate-200 outline-none bg-transparent focus:border-brand-500 print:border-none" />
            </div>
            <div className="flex justify-end items-center">
              <span className="font-bold mr-4">PAYMENT DUE DATE</span>
              <input type="date" name="Due_Date" value={formData.Due_Date} onChange={handleInputChange} className="w-32 text-right border-b border-dashed border-slate-200 outline-none bg-transparent focus:border-brand-500 print:border-none" />
            </div>
            <div className="flex justify-end items-center pt-2">
              <span className="font-bold mr-4">YOU REF NO.</span>
              <input type="text" name="Ref_No" value={formData.Ref_No} onChange={handleInputChange} className="w-48 text-right border-b border-dashed border-slate-200 outline-none bg-transparent focus:border-brand-500 print:border-none" />
            </div>
            <div className="flex justify-end items-center">
              <span className="font-bold mr-4">PROJECT NAME</span>
              <input type="text" name="Project_Code" value={formData.Project_Code} onChange={handleInputChange} className="w-48 text-right border-b border-dashed border-slate-200 outline-none bg-transparent focus:border-brand-500 print:border-none" />
            </div>
            <div className="print-hidden flex justify-end items-center pt-2">
              <span className="font-bold mr-4 text-slate-500">STATUS</span>
              <select name="Payment_Status" value={formData.Payment_Status} onChange={handleInputChange} className="w-32 text-right border border-slate-200 rounded p-1 text-xs outline-none bg-transparent focus:border-brand-500">
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* 🌟 Main Items Table (10 Rows) 🌟 */}
        <div className="border border-black mb-6">
          <table className="w-full text-sm">
            <thead className="border-b border-black text-center text-xs">
              <tr className="divide-x divide-black">
                <th className="py-2 w-[15%] font-medium">PRODUCT ID</th>
                <th className="py-2 w-[50%] font-medium">DESCRIPTION</th>
                <th className="py-2 w-[10%] font-medium">QUANTITY</th>
                <th className="py-2 w-[12.5%] font-medium">U/PRICE</th>
                <th className="py-2 w-[12.5%] font-medium">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-x divide-black align-top min-h-[300px]">
              {invoiceItems.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                  <td className="p-1">
                    <input type="text" value={item.Product_ID} onChange={(e) => handleItemChange(idx, 'Product_ID', e.target.value)} className="w-full text-center text-xs bg-transparent outline-none focus:bg-slate-50 print:bg-transparent" placeholder={idx === 0 ? "ID" : ""} />
                  </td>
                  <td className="p-1">
                    <input type="text" value={item.Description} onChange={(e) => handleItemChange(idx, 'Description', e.target.value)} className="w-full text-xs bg-transparent outline-none focus:bg-slate-50 print:bg-transparent" placeholder={idx === 0 ? "Description..." : ""} />
                  </td>
                  <td className="p-1">
                    <input type="number" step="any" value={item.Quantity} onChange={(e) => handleItemChange(idx, 'Quantity', e.target.value)} className="w-full text-center text-xs bg-transparent outline-none focus:bg-slate-50 print:bg-transparent [&::-webkit-inner-spin-button]:appearance-none" placeholder={idx === 0 ? "1" : ""} />
                  </td>
                  <td className="p-1">
                    <input type="number" step="any" value={item.Unit_Price} onChange={(e) => handleItemChange(idx, 'Unit_Price', e.target.value)} className="w-full text-right text-xs bg-transparent outline-none focus:bg-slate-50 print:bg-transparent [&::-webkit-inner-spin-button]:appearance-none" placeholder={idx === 0 ? "0.00" : ""} />
                  </td>
                  <td className="p-1 text-right bg-slate-50/30 print:bg-transparent">
                    <span className="block font-mono text-xs pr-1">{item.Amount !== '0.00' && item.Amount !== '0' ? Number(item.Amount).toLocaleString() : ''}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="print-hidden p-2 text-right text-xs text-slate-400 bg-slate-50">
            Currency: 
            <select name="Currency" value={formData.Currency} onChange={handleInputChange} className="ml-2 outline-none bg-transparent font-bold text-slate-600">
              <option value="USD">USD</option>
              <option value="MMK">MMK</option>
              <option value="SGD">SGD</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-start justify-between">
          <div className="w-[55%] pr-4 space-y-4">
            <div className="border border-black">
              <div className="border-b border-black px-2 py-1 text-xs font-bold bg-slate-50 print:bg-transparent">REMARK</div>
              <textarea name="Remarks" value={formData.Remarks} onChange={handleInputChange} rows={3} className="w-full p-2 text-xs text-red-500 bg-transparent outline-none resize-none print:bg-transparent" placeholder="Special instructions..."></textarea>
            </div>
            
            <div className="border border-black text-xs p-2">
              <div className="font-bold mb-2">BANK DETAILS</div>
              <div className="grid grid-cols-[110px_1fr] gap-y-1 items-center">
                <span className="font-semibold">Beneficiary Name</span>
                <div className="flex"><span className="mr-1">:</span><input value={bankDetails.beneficiary} onChange={e => setBankDetails({...bankDetails, beneficiary: e.target.value})} className="flex-1 text-[#003399] uppercase bg-transparent outline-none print:border-none" /></div>
                <span className="font-semibold">Bank</span>
                <div className="flex"><span className="mr-1">:</span><input value={bankDetails.bank} onChange={e => setBankDetails({...bankDetails, bank: e.target.value})} className="flex-1 bg-transparent outline-none print:border-none" /></div>
                <span className="font-semibold">SWIFT Address</span>
                <div className="flex"><span className="mr-1">:</span><input value={bankDetails.swift} onChange={e => setBankDetails({...bankDetails, swift: e.target.value})} className="flex-1 bg-transparent outline-none print:border-none" /></div>
                <span className="font-semibold">Bank Address</span>
                <div className="flex"><span className="mr-1">:</span><input value={bankDetails.address} onChange={e => setBankDetails({...bankDetails, address: e.target.value})} className="flex-1 bg-transparent outline-none print:border-none" /></div>
              </div>
            </div>
          </div>

          <div className="w-[40%]">
            <table className="w-full text-sm font-bold text-right border-collapse">
              <tbody>
                <tr>
                  <td className="py-1 pr-4">SUB TOTAL</td>
                  <td className="py-1 text-center text-slate-500 w-12">{formData.Currency}</td>
                  <td className="py-1 border border-black px-2 w-32 bg-slate-50 print:bg-transparent">{Number(formData.Subtotal).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">DISCOUNT</td>
                  <td className="py-1 text-center text-slate-500">{formData.Currency}</td>
                  <td className="py-0 border border-black">
                    <input type="number" step="any" name="Discount" value={formData.Discount} onChange={handleInputChange} className="w-full h-full py-1 px-2 text-right bg-transparent outline-none print:bg-transparent [&::-webkit-inner-spin-button]:appearance-none" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">TAX</td>
                  <td className="py-1 text-center text-slate-500">{formData.Currency}</td>
                  <td className="py-0 border border-black">
                    <input type="number" step="any" name="Tax_Amount" value={formData.Tax_Amount} onChange={handleInputChange} className="w-full h-full py-1 px-2 text-right bg-transparent outline-none print:bg-transparent [&::-webkit-inner-spin-button]:appearance-none" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">GRAND TOTAL</td>
                  <td className="py-1 text-center text-slate-500">{formData.Currency}</td>
                  <td className="py-1 border border-black px-2 bg-slate-100 print:bg-transparent">{Number(formData.Grand_Total).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-16 text-center text-[#003399] font-bold text-sm">
              <p>The Insights Solution</p>
              <div className="mt-8 border-t border-[#003399] w-48 mx-auto pt-1">
                Authorized Signature
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Full Customer Modal */}
      {isCustomerModalOpen && (
        <div className="print-hidden fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-800">Quick Add Customer</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleQuickAddCustomer} className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Partner ID <span className="text-rose-500">*</span></label>
                    <input type="text" name="Partner_ID" value={newCustomer.Partner_ID} onChange={(e) => setNewCustomer({...newCustomer, Partner_ID: e.target.value})} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none" readOnly />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Partner Name <span className="text-rose-500">*</span></label>
                    <input type="text" name="Partner_Name" value={newCustomer.Partner_Name} onChange={(e) => setNewCustomer({...newCustomer, Partner_Name: e.target.value})} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    <select name="Partner_Type" value={newCustomer.Partner_Type} onChange={(e) => setNewCustomer({...newCustomer, Partner_Type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-brand-500">
                      <option value="Customer">Customer</option>
                      <option value="Both">Both (Cust & Vend)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isAddingCustomer} className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-70">
                  {isAddingCustomer ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}