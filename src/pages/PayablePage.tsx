// src/pages/PayablePage.tsx

// ==========================================
// ၁။ လိုအပ်သော Packages နှင့် Icons များ ခေါ်ယူခြင်း
// ==========================================
import { useState, useEffect } from 'react';
import { Plus, Search, X, Pencil, Trash2, MoreHorizontal, Eye, ShoppingCart, TrendingDown, CheckCircle2 } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';

export default function PayablePage() {
  // ==========================================
  // ၂။ State များ ကြေညာခြင်း (Variables)
  // ==========================================
  const SHEET_NAME = '7_Accounts_Payable';

  const [pos, setPos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // Database တွင်ရှိသော Column ၂၆ ခု အတိအကျကို Form State အဖြစ် သတ်မှတ်ခြင်း
  const initialForm = {
    Bill_Date: new Date().toISOString().split('T')[0],
    Due_Date: '',
    PO_No: '',
    Supplier_ID: '',
    Supplier_Name: '',
    Project_Code: '',
    Project_Name: '',
    Product_ID: '',
    Product_Name: '',
    Description: '',
    Quantity: '1',
    Unit_Price: '0',
    Currency: 'USD',
    Exchange_Rate: '1',
    Subtotal: '0',
    Tax_Amount: '0',
    Grand_Total: '0',
    Payment_Terms: 'COD',
    Payment_Status: 'Pending',
    Remarks: '',
    Ship_To: '',
    Bill_To: '',
    Contact: '',
    Email: '',
    Phone: '',
    'Ref_No.': ''
  };

  const [formData, setFormData] = useState<any>(initialForm);

  // ==========================================
  // ၃။ Data များ ဆွဲယူခြင်း (Fetch API)
  // ==========================================
  const fetchPOs = async () => {
    setIsLoading(true);
    try {
      const data = await googleSheetsService.readData(SHEET_NAME);
      setPos(data);
    } catch (err) {
      alert("PO Data များ ရယူရာတွင် အခက်အခဲရှိနေပါသည်။");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  // ==========================================
  // ၄။ Input အပြောင်းအလဲများကို ဖမ်းယူ၍ Auto တွက်ချက်ခြင်း
  // ==========================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: any) => {
      let newData = { ...prev, [name]: value };

      // Qty, Price သို့မဟုတ် Tax ပြောင်းလဲပါက Total များကို Auto တွက်မည်
      if (['Quantity', 'Unit_Price', 'Tax_Amount'].includes(name)) {
        const qty = parseFloat(newData.Quantity || '0');
        const price = parseFloat(newData.Unit_Price || '0');
        const tax = parseFloat(newData.Tax_Amount || '0');
        
        const subtotal = qty * price;
        newData.Subtotal = subtotal.toString();
        newData.Grand_Total = (subtotal + tax).toString();
      }

      return newData;
    });
  };

  // ==========================================
  // ၅။ Data သိမ်းဆည်းခြင်း (Submit Form)
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingRow) {
        const payload = { ...formData, _rowIndex: editingRow._rowIndex };
        await googleSheetsService.updateData(SHEET_NAME, payload);
      } else {
        await googleSheetsService.writeData(SHEET_NAME, formData);
      }
      setIsModalOpen(false);
      setEditingRow(null);
      setFormData(initialForm);
      fetchPOs();
    } catch (err) {
      alert("Data သိမ်းဆည်းရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // ၆။ Data ဖျက်ခြင်း (Delete Action)
  // ==========================================
  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    setIsDeleting(true);
    try {
      await googleSheetsService.deleteData(SHEET_NAME, deleteConfirmId);
      setPos(prev => prev.filter(p => p._rowIndex !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert("Data ဖျက်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (po: any) => {
    setEditingRow(po);
    setFormData(po);
    setIsModalOpen(true);
  };

  // ==========================================
  // ၇။ Search Filter နှင့် KPI တွက်ချက်မှုများ
  // ==========================================
  const filteredPOs = pos.filter(po => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (po.PO_No?.toLowerCase() || '').includes(query) ||
      (po.Supplier_Name?.toLowerCase() || '').includes(query) ||
      (po.Project_Name?.toLowerCase() || '').includes(query) ||
      (po.Product_Name?.toLowerCase() || '').includes(query)
    );
  });

  // KPI တွက်ချက်ခြင်း (Total, Paid, Pending)
  const totalPayable = filteredPOs.reduce((sum, po) => sum + Number(po.Grand_Total || 0), 0);
  const paidAmount = filteredPOs.filter(po => po.Payment_Status === 'Paid').reduce((sum, po) => sum + Number(po.Grand_Total || 0), 0);
  const pendingAmount = totalPayable - paidAmount;

  // ==========================================
  // ၈။ UI ရေးဆွဲခြင်း (Main Render)
  // ==========================================
  return (
    <div className="space-y-6 relative">
      
      {/* ၈.၁ ခေါင်းစဉ်နှင့် Add ခလုတ် */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Accounts Payable (PO)</h2>
          <p className="text-sm text-slate-500">Manage Purchase Orders and Supplier Payments</p>
        </div>
        <button onClick={() => { setEditingRow(null); setFormData(initialForm); setIsModalOpen(true); }} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-700 shadow-sm">
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>

      {/* ၈.၂ 3 KPIs Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Payable Amount</p>
            <p className="text-xl font-bold text-slate-800">${Number(totalPayable).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Paid</p>
            <p className="text-xl font-bold text-slate-800">${Number(paidAmount).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-rose-50 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Amount</p>
            <p className="text-xl font-bold text-rose-600">${Number(pendingAmount).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ၈.၃ Search Bar နှင့် Table ဇယား */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" placeholder="Search PO, Supplier, Project..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3">Bill Date</th>
                <th className="px-4 py-3">PO No.</th>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {isLoading && pos.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading POs...</td></tr>
              ) : filteredPOs.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No Purchase Orders found.</td></tr>
              ) : (
                filteredPOs.map((po, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">{po.Bill_Date}</td>
                    <td className="px-4 py-3 font-bold text-brand-700">{po.PO_No}</td>
                    <td className="px-4 py-3">{po.Supplier_Name}</td>
                    <td className="px-4 py-3 text-xs">{po.Project_Name}</td>
                    <td className="px-4 py-3 text-right font-medium">{po.Currency} {Number(po.Grand_Total).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${po.Payment_Status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {po.Payment_Status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 relative text-center">
                      <button onClick={() => setOpenMenuIndex(openMenuIndex === idx ? null : idx)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                        <MoreHorizontal className="w-5 h-5 mx-auto" />
                      </button>
                      
                      {openMenuIndex === idx && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuIndex(null)} />
                          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 bg-white rounded-lg shadow-xl border border-slate-200 z-20 py-1 animate-fade-in text-left">
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                              <Eye className="w-4 h-4" /> View
                            </button>
                            <button onClick={() => { openEditModal(po); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => { setDeleteConfirmId(po._rowIndex); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ၈.၄ Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete PO?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this Purchase Order?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700">{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ၉။ Purchase Order (PO) Form Modal */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header ပိုင်း */}
            <div className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold tracking-wider">PURCHASE ORDER</h3>
                <p className="text-blue-200 text-sm">{editingRow ? "Edit existing PO" : "Create new PO"}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-blue-200"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Top Section: PO Details & Ref */}
              <div className="flex flex-wrap justify-between items-start border-b border-slate-200 pb-4 mb-4 gap-4">
                <div className="space-y-3 w-full md:w-1/3">
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-xs font-bold text-blue-800">PO NO.</label>
                    <input name="PO_No" value={formData.PO_No} onChange={handleInputChange} required className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none font-bold" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-xs font-bold text-blue-800">YOUR REF NO.</label>
                    <input name="Ref_No." value={formData['Ref_No.']} onChange={handleInputChange} className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none" />
                  </div>
                </div>
                <div className="space-y-3 w-full md:w-1/3">
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-xs font-bold text-blue-800">BILL DATE</label>
                    <input type="date" name="Bill_Date" value={formData.Bill_Date} onChange={handleInputChange} required className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-xs font-bold text-blue-800">DUE DATE</label>
                    <input type="date" name="Due_Date" value={formData.Due_Date} onChange={handleInputChange} className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Middle Section: Ship To, Bill To, Supplier Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Ship To & Bill To */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1 border-b border-blue-200 pb-1">SHIP TO</label>
                    <textarea name="Ship_To" value={formData.Ship_To} onChange={handleInputChange} rows={3} className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1 border-b border-blue-200 pb-1">BILL TO</label>
                    <textarea name="Bill_To" value={formData.Bill_To} onChange={handleInputChange} rows={3} className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none bg-slate-50" />
                  </div>
                </div>

                {/* Supplier Info */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-blue-800 mb-2 border-b border-blue-200 pb-1">SUPPLIER INFO.</label>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-[11px] text-slate-500 uppercase">ID</span>
                    <input name="Supplier_ID" value={formData.Supplier_ID} onChange={handleInputChange} className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm outline-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-[11px] text-slate-500 uppercase">Name</span>
                    <input name="Supplier_Name" value={formData.Supplier_Name} onChange={handleInputChange} className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm outline-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-[11px] text-slate-500 uppercase">Contact</span>
                    <input name="Contact" value={formData.Contact} onChange={handleInputChange} className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm outline-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-[11px] text-slate-500 uppercase">Email</span>
                    <input name="Email" value={formData.Email} onChange={handleInputChange} className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm outline-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-[11px] text-slate-500 uppercase">Phone</span>
                    <input name="Phone" value={formData.Phone} onChange={handleInputChange} className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm outline-none" />
                  </div>
                </div>

                {/* Project & Terms */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1 border-b border-blue-200 pb-1">PROJECT DETAILS</label>
                    <div className="space-y-2 mt-2">
                      <input name="Project_Code" placeholder="Project Code" value={formData.Project_Code} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm outline-none" />
                      <input name="Project_Name" placeholder="Project Name" value={formData.Project_Name} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1 border-b border-blue-200 pb-1">PAYMENT & STATUS</label>
                    <div className="flex gap-2 mt-2">
                      <select name="Payment_Terms" value={formData.Payment_Terms} onChange={handleInputChange} className="w-1/2 px-2 py-1.5 border border-slate-300 rounded text-sm outline-none">
                        <option value="COD">COD</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                        <option value="Advance">Advance</option>
                      </select>
                      <select name="Payment_Status" value={formData.Payment_Status} onChange={handleInputChange} className="w-1/2 px-2 py-1.5 border border-slate-300 rounded text-sm outline-none">
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Section (Mini Table Layout) */}
              <div className="border border-blue-800 rounded-lg overflow-hidden mb-6">
                <div className="bg-blue-900 text-white flex text-xs font-bold uppercase tracking-wider text-center">
                  <div className="w-1/4 p-2 border-r border-blue-700">Product ID / Name</div>
                  <div className="w-2/5 p-2 border-r border-blue-700">Description</div>
                  <div className="w-24 p-2 border-r border-blue-700">Qty</div>
                  <div className="w-32 p-2 border-r border-blue-700">U/Price</div>
                  <div className="w-32 p-2">Amount</div>
                </div>
                <div className="flex bg-white">
                  <div className="w-1/4 p-2 border-r border-slate-200 space-y-2">
                    <input name="Product_ID" placeholder="ID" value={formData.Product_ID} onChange={handleInputChange} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                    <input name="Product_Name" placeholder="Name" value={formData.Product_Name} onChange={handleInputChange} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                  </div>
                  <div className="w-2/5 p-2 border-r border-slate-200">
                    <textarea name="Description" placeholder="Item Description" value={formData.Description} onChange={handleInputChange} rows={3} className="w-full px-2 py-1 border border-slate-200 rounded text-sm h-full resize-none" />
                  </div>
                  <div className="w-24 p-2 border-r border-slate-200">
                    <input type="number" name="Quantity" value={formData.Quantity} onChange={handleInputChange} className="w-full px-2 py-1 border border-slate-200 rounded text-sm text-center" min="1" />
                  </div>
                  <div className="w-32 p-2 border-r border-slate-200 relative">
                    <span className="absolute left-3 top-3 text-slate-400 text-sm">$</span>
                    <input type="number" name="Unit_Price" value={formData.Unit_Price} onChange={handleInputChange} className="w-full pl-6 pr-2 py-1 border border-slate-200 rounded text-sm text-right" step="0.01" />
                  </div>
                  <div className="w-32 p-2 bg-slate-50 flex items-center justify-end font-bold text-slate-700">
                    ${Number(formData.Subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Footer Section: Remarks & Totals */}
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="w-full md:w-1/2">
                  <label className="block text-xs font-bold text-blue-800 mb-1 border-b border-blue-200 pb-1">REMARKS</label>
                  <textarea name="Remarks" value={formData.Remarks} onChange={handleInputChange} rows={4} className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none" />
                </div>
                <div className="w-full md:w-1/3 border-2 border-slate-800 rounded-lg overflow-hidden h-fit">
                  <div className="flex justify-between items-center p-2 border-b border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold">SUBTOTAL</span>
                    <span className="text-sm font-medium">${Number(formData.Subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b border-slate-200">
                    <span className="text-xs font-bold">TAX AMOUNT</span>
                    <div className="flex items-center gap-1 w-24">
                      <span className="text-slate-400 text-sm">$</span>
                      <input type="number" name="Tax_Amount" value={formData.Tax_Amount} onChange={handleInputChange} className="w-full text-right bg-transparent outline-none border-b border-slate-300 text-sm" step="0.01" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50">
                    <span className="text-sm font-bold text-blue-900">GRAND TOTAL</span>
                    <span className="text-lg font-bold text-blue-900">${Number(formData.Grand_Total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 flex items-center gap-2">
                  {isSubmitting ? 'Saving...' : 'Save Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}