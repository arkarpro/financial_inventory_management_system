// src/pages/InventoryMovementsPage.tsx

import { useState, useEffect } from 'react';
import { Plus, Search, X, Pencil, Trash2, MoreHorizontal, ArrowRightLeft, PackagePlus, PackageMinus, Activity, Eye, CheckCircle2 } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';

export default function InventoryMovementsPage() {
  // ==========================================
  // ၁။ State များ ကြေညာခြင်း (Variables)
  // ==========================================
  const SHEET_NAME = '5_Inventory_Movements';

  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // Database ရှိ ကော်လံ (၁၂) ခု အတိအကျ
  const initialForm = {
    Movement_ID: '',
    Date: new Date().toISOString().split('T')[0],
    Transaction_Type: 'Goods Receipt', // Goods Receipt, Goods Issue, Transfer, Adjustment
    Reference_No: '',
    Location_ID: 'Main Warehouse',
    Product_ID: '',
    Qty_In: '0',
    Qty_Out: '0',
    Balance_Qty: '0',
    Unit_Cost: '0',
    Total_Value: '0',
    Remarks: ''
  };

  const [formData, setFormData] = useState<any>(initialForm);

  // ==========================================
  // ၂။ Data များ ဆွဲယူခြင်း (Fetch API)
  // ==========================================
  const fetchMovements = async () => {
    setIsLoading(true);
    try {
      const data = await googleSheetsService.readData(SHEET_NAME);
      setMovements(data);
    } catch (err) {
      alert("Inventory Movements Data များ ရယူရာတွင် အခက်အခဲရှိနေပါသည်။");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMovements(); }, []);

  // ==========================================
  // ၃။ Input ပြောင်းလဲမှု နှင့် Auto Calculation ဖမ်းယူခြင်း
  // ==========================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: any) => {
      let newData = { ...prev, [name]: value };

      // Qty In, Qty Out သို့မဟုတ် Unit Cost ပြောင်းလဲပါက Total Value ကို တွက်မည်
      if (['Qty_In', 'Qty_Out', 'Unit_Cost'].includes(name)) {
        const qtyIn = parseFloat(newData.Qty_In || '0');
        const qtyOut = parseFloat(newData.Qty_Out || '0');
        const cost = parseFloat(newData.Unit_Cost || '0');
        
        // အဝင် သို့မဟုတ် အထွက် အရေအတွက်ကို ယူ၍ တန်ဖိုးတွက်မည်
        const activeQty = qtyIn > 0 ? qtyIn : qtyOut;
        newData.Total_Value = (activeQty * cost).toString();
      }

      // Transaction Type အလိုက် Qty များကို ရှင်းလင်းပေးမည်
      if (name === 'Transaction_Type') {
        if (value === 'Goods Receipt' || value === 'Positive Adj') newData.Qty_Out = '0';
        if (value === 'Goods Issue' || value === 'Negative Adj') newData.Qty_In = '0';
      }

      return newData;
    });
  };

  // ==========================================
  // ၄။ Data သိမ်းဆည်းခြင်း (Submit Form)
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
      fetchMovements();
    } catch (err) {
      alert("Data သိမ်းဆည်းရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // ၅။ Data ဖျက်ခြင်း (Delete)
  // ==========================================
  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    setIsDeleting(true);
    try {
      await googleSheetsService.deleteData(SHEET_NAME, deleteConfirmId);
      setMovements(prev => prev.filter(p => p._rowIndex !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert("Data ဖျက်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (movement: any) => {
    setEditingRow(movement);
    setFormData(movement);
    setIsModalOpen(true);
  };

  // ==========================================
  // ၆။ Search Filter နှင့် 3 KPIs တွက်ချက်မှုများ
  // ==========================================
  const filteredMovements = movements.filter(mov => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (mov.Movement_ID?.toLowerCase() || '').includes(query) ||
      (mov.Reference_No?.toLowerCase() || '').includes(query) ||
      (mov.Product_ID?.toLowerCase() || '').includes(query) ||
      (mov.Transaction_Type?.toLowerCase() || '').includes(query)
    );
  });

  // KPI တွက်ချက်ခြင်း
  const totalTransactions = filteredMovements.length;
  const totalQtyIn = filteredMovements.reduce((sum, mov) => sum + Number(mov.Qty_In || 0), 0);
  const totalQtyOut = filteredMovements.reduce((sum, mov) => sum + Number(mov.Qty_Out || 0), 0);

  // ==========================================
  // ၇။ UI ရေးဆွဲခြင်း (Main Render)
  // ==========================================
  return (
    <div className="space-y-6 relative">
      
      {/* ၇.၁ ခေါင်းစဉ်နှင့် Add ခလုတ် */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Movements</h2>
          <p className="text-sm text-slate-500">Track all stock-in, stock-out, and adjustment transactions</p>
        </div>
        <button onClick={() => { setEditingRow(null); setFormData(initialForm); setIsModalOpen(true); }} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Movement
        </button>
      </div>

      {/* ၇.၂ 3 KPIs Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Transactions</p>
            <p className="text-xl font-bold text-slate-800">{totalTransactions}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center">
            <PackagePlus className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Qty In</p>
            <p className="text-xl font-bold text-emerald-600">+{totalQtyIn}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center">
            <PackageMinus className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Qty Out</p>
            <p className="text-xl font-bold text-orange-600">-{totalQtyOut}</p>
          </div>
        </div>
      </div>

      {/* ၇.၃ Search Bar နှင့် Table ဇယား */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" placeholder="Search by ID, Product, Ref No, or Type..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Movement ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Product ID</th>
                <th className="px-4 py-3 text-right text-emerald-600">Qty In</th>
                <th className="px-4 py-3 text-right text-orange-600">Qty Out</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {isLoading && movements.length === 0 ? (
                 <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500">Loading Movements...</td></tr>
              ) : filteredMovements.length === 0 ? (
                 <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500">No movement records found.</td></tr>
              ) : (
                filteredMovements.map((mov, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">{mov.Date}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{mov.Movement_ID}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-max
                        ${mov.Transaction_Type?.includes('Receipt') || mov.Transaction_Type?.includes('Positive') ? 'bg-emerald-100 text-emerald-700' : 
                          mov.Transaction_Type?.includes('Issue') || mov.Transaction_Type?.includes('Negative') ? 'bg-orange-100 text-orange-700' : 
                          'bg-blue-100 text-blue-700'}`}>
                        {mov.Transaction_Type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{mov.Product_ID}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{Number(mov.Qty_In) > 0 ? `+${mov.Qty_In}` : '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">{Number(mov.Qty_Out) > 0 ? `-${mov.Qty_Out}` : '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-700">{mov.Balance_Qty}</td>
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
                            <button onClick={() => { openEditModal(mov); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => { setDeleteConfirmId(mov._rowIndex); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Record?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this movement record? It may cause discrepancies in stock balances.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700">{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ၇.၄ Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-brand-600"/> 
                {editingRow ? "Edit Movement" : "New Inventory Movement"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Document Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Movement ID <span className="text-rose-500">*</span></label>
                  <input name="Movement_ID" value={formData.Movement_ID} onChange={handleInputChange} required className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-brand-500 outline-none font-bold" placeholder="MOV-001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                  <input type="date" name="Date" value={formData.Date} onChange={handleInputChange} required className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Transaction Type</label>
                  <select name="Transaction_Type" value={formData.Transaction_Type} onChange={handleInputChange} className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-brand-500 outline-none bg-white">
                    <option value="Goods Receipt">Goods Receipt (IN)</option>
                    <option value="Goods Issue">Goods Issue (OUT)</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Positive Adj">Positive Adj (+)</option>
                    <option value="Negative Adj">Negative Adj (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Reference No</label>
                  <input name="Reference_No" value={formData.Reference_No} onChange={handleInputChange} className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-brand-500 outline-none" placeholder="PO / INV / Adj Ref" />
                </div>
              </div>

              {/* Item Details */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">Movement Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Product ID <span className="text-rose-500">*</span></label>
                    <input name="Product_ID" value={formData.Product_ID} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-brand-500 outline-none" placeholder="Enter Item Code" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Location ID</label>
                    <input name="Location_ID" value={formData.Location_ID} onChange={handleInputChange} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-brand-500 outline-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Qty In</label>
                    <input type="number" name="Qty_In" value={formData.Qty_In} onChange={handleInputChange} min="0" disabled={formData.Transaction_Type.includes('Issue') || formData.Transaction_Type.includes('Negative')} className="w-full px-3 py-2 border border-emerald-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-center font-bold text-emerald-700 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Qty Out</label>
                    <input type="number" name="Qty_Out" value={formData.Qty_Out} onChange={handleInputChange} min="0" disabled={formData.Transaction_Type.includes('Receipt') || formData.Transaction_Type.includes('Positive')} className="w-full px-3 py-2 border border-orange-300 rounded focus:ring-1 focus:ring-orange-500 outline-none text-center font-bold text-orange-700 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Unit Cost</label>
                    <input type="number" name="Unit_Cost" value={formData.Unit_Cost} onChange={handleInputChange} min="0" step="0.01" className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-brand-500 outline-none text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Total Value</label>
                    <input type="number" name="Total_Value" value={formData.Total_Value} readOnly className="w-full px-3 py-2 border bg-slate-100 rounded outline-none text-right font-bold text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Balance Qty</label>
                    <input type="number" name="Balance_Qty" value={formData.Balance_Qty} onChange={handleInputChange} className="w-full px-3 py-2 border border-brand-300 rounded focus:ring-1 focus:ring-brand-500 outline-none text-center font-bold text-brand-700" placeholder="New Bal" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Remarks</label>
                <textarea name="Remarks" value={formData.Remarks} onChange={handleInputChange} rows={2} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-brand-500 outline-none resize-none"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-md transition-colors disabled:opacity-70 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4"/> {isSubmitting ? 'Saving...' : 'Save Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}