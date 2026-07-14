// src/pages/GoodsReceiptPage.tsx

import { useState, useEffect } from 'react';
import { Plus, Search, X, Pencil, Trash2, MoreHorizontal, PackagePlus, Boxes, DollarSign, CheckCircle2 } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';

export default function GoodsReceiptPage() {
  const SHEET_NAME = '3_Goods_Receipt_IN';

  const [grs, setGrs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // Database ရှိ ကော်လံ (၁၂) ခု
  const initialForm = {
    GR_No: '',
    Date: new Date().toISOString().split('T')[0],
    PO_No: '',
    Supplier_ID: '',
    Location_ID: 'Main Warehouse',
    Product_ID: '',
    Qty_Received: '1',
    Unit_Cost: '0',
    Total_Cost: '0',
    Batch_No: '',
    Received_By: '',
    Remarks: ''
  };

  const [formData, setFormData] = useState<any>(initialForm);

  const fetchGRs = async () => {
    setIsLoading(true);
    try {
      const data = await googleSheetsService.readData(SHEET_NAME);
      setGrs(data);
    } catch (err) {
      alert("Goods Receipt Data များ ရယူရာတွင် အခက်အခဲရှိနေပါသည်။");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchGRs(); }, []);

  // Input ပြောင်းလဲမှု နှင့် Qty * Cost = Total တွက်ချက်ခြင်း
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: any) => {
      let newData = { ...prev, [name]: value };

      if (name === 'Qty_Received' || name === 'Unit_Cost') {
        const qty = parseFloat(newData.Qty_Received || '0');
        const cost = parseFloat(newData.Unit_Cost || '0');
        newData.Total_Cost = (qty * cost).toString();
      }
      return newData;
    });
  };

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
      fetchGRs();
    } catch (err) {
      alert("Data သိမ်းဆည်းရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    setIsDeleting(true);
    try {
      await googleSheetsService.deleteData(SHEET_NAME, deleteConfirmId);
      setGrs(prev => prev.filter(p => p._rowIndex !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert("Data ဖျက်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (gr: any) => {
    setEditingRow(gr);
    setFormData(gr);
    setIsModalOpen(true);
  };

  // Search Filter
  const filteredGRs = grs.filter(gr => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (gr.GR_No?.toLowerCase() || '').includes(query) ||
      (gr.PO_No?.toLowerCase() || '').includes(query) ||
      (gr.Product_ID?.toLowerCase() || '').includes(query) ||
      (gr.Supplier_ID?.toLowerCase() || '').includes(query)
    );
  });

  // KPIs တွက်ချက်ခြင်း
  const uniqueGRs = new Set(filteredGRs.map(gr => gr.GR_No)).size;
  const totalItemsReceived = filteredGRs.reduce((sum, gr) => sum + Number(gr.Qty_Received || 0), 0);
  const totalValue = filteredGRs.reduce((sum, gr) => sum + Number(gr.Total_Cost || 0), 0);

  return (
    <div className="space-y-6 relative">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Goods Receipt (IN)</h2>
          <p className="text-sm text-slate-500">Record inventory inbound items and supplier deliveries</p>
        </div>
        <button onClick={() => { setEditingRow(null); setFormData(initialForm); setIsModalOpen(true); }} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-700 shadow-sm">
          <Plus className="w-4 h-4" /> Receive Goods
        </button>
      </div>

      {/* 3 KPIs Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
            <PackagePlus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total GR Documents</p>
            <p className="text-xl font-bold text-slate-800">{uniqueGRs}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Units Received</p>
            <p className="text-xl font-bold text-slate-800">{totalItemsReceived}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Value Inward</p>
            <p className="text-xl font-bold text-slate-800">${Number(totalValue).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" placeholder="Search by GR No, PO No, Product ID..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3">GR Date</th>
                <th className="px-4 py-3">GR No.</th>
                <th className="px-4 py-3">PO Ref</th>
                <th className="px-4 py-3">Product ID</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {isLoading && grs.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading Receipts...</td></tr>
              ) : filteredGRs.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No records found.</td></tr>
              ) : (
                filteredGRs.map((gr, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">{gr.Date}</td>
                    <td className="px-4 py-3 font-bold text-brand-700">{gr.GR_No}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{gr.PO_No || '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{gr.Product_ID}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{gr.Qty_Received}</td>
                    <td className="px-4 py-3 text-right">${Number(gr.Total_Cost).toLocaleString()}</td>
                    <td className="px-4 py-3 relative text-center">
                      <button onClick={() => setOpenMenuIndex(openMenuIndex === idx ? null : idx)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                        <MoreHorizontal className="w-5 h-5 mx-auto" />
                      </button>
                      
                      {openMenuIndex === idx && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuIndex(null)} />
                          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 bg-white rounded-lg shadow-xl border border-slate-200 z-20 py-1 animate-fade-in text-left">
                            <button onClick={() => { openEditModal(gr); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => { setDeleteConfirmId(gr._rowIndex); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
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
            <p className="text-sm text-slate-500 mb-6">This will remove the item from the receipt history and affect inventory balance.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700">{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-brand-600"/> 
                {editingRow ? "Edit Goods Receipt" : "New Goods Receipt"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Document Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">GR No <span className="text-rose-500">*</span></label>
                  <input name="GR_No" value={formData.GR_No} onChange={handleInputChange} required className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-brand-500 outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                  <input type="date" name="Date" value={formData.Date} onChange={handleInputChange} required className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">PO Ref No</label>
                  <input name="PO_No" value={formData.PO_No} onChange={handleInputChange} className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-brand-500 outline-none" placeholder="e.g. PO-0012" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Supplier ID</label>
                  <input name="Supplier_ID" value={formData.Supplier_ID} onChange={handleInputChange} className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Location ID</label>
                  <input name="Location_ID" value={formData.Location_ID} onChange={handleInputChange} className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Received By</label>
                  <input name="Received_By" value={formData.Received_By} onChange={handleInputChange} className="w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-brand-500 outline-none" />
                </div>
              </div>

              {/* Item Details */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">Item Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Product ID <span className="text-rose-500">*</span></label>
                    <input name="Product_ID" value={formData.Product_ID} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-brand-500 outline-none" placeholder="Enter Item Code" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Batch No.</label>
                    <input name="Batch_No" value={formData.Batch_No} onChange={handleInputChange} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-brand-500 outline-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Qty Received <span className="text-rose-500">*</span></label>
                    <input type="number" name="Qty_Received" value={formData.Qty_Received} onChange={handleInputChange} min="1" required className="w-full px-3 py-2 border border-emerald-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-center font-bold text-emerald-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Unit Cost</label>
                    <input type="number" name="Unit_Cost" value={formData.Unit_Cost} onChange={handleInputChange} min="0" step="0.01" className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-brand-500 outline-none text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Total Cost (Auto)</label>
                    <input type="number" name="Total_Cost" value={formData.Total_Cost} readOnly className="w-full px-3 py-2 border bg-slate-100 rounded outline-none text-right font-bold text-slate-700" />
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
                  <CheckCircle2 className="w-4 h-4"/> {isSubmitting ? 'Saving...' : 'Save Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}