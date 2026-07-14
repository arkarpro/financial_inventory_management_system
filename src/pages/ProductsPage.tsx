// src/pages/ProductsPage.tsx

import { useState, useEffect } from 'react';
import { Plus, Search, X, Pencil, Trash2, MoreHorizontal, Eye, Boxes, AlertTriangle, DollarSign } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';

export default function ProductsPage() {
  const SHEET_NAME = '1_Product_Master'; // Sheet အမည်ကို ပြင်ဆင်ထားသည်

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // Database ရှိ ကော်လံ ၁၉ ခု အားလုံးကို Form State အဖြစ် သတ်မှတ်ခြင်း
  const initialForm = {
    Product_ID: '', Product_Name: '', Description: '', Starting_Inventory: '0', 
    Re_Order_Point: '0', UOM: 'Pcs', Category: '', Track_Inventory: 'Yes', 
    Taxable: 'Yes', HS_Code: '', Default_Location: '', Avg_Unit_Price: '0', 
    Stock_Value: '0', Shipping_Cost: '0', Duty_Percent: '0', Duty_Upon_Unit_Price: '0', 
    AT_2_Percent_Clearence: '0', Unit_Price_DDP: '0', Stock_Value_DDP: '0'
  };

  const [formData, setFormData] = useState<any>(initialForm);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await googleSheetsService.readData(SHEET_NAME);
      setProducts(data);
    } catch (err) {
      alert("Products Data များ ရယူရာတွင် အခက်အခဲရှိနေပါသည်။");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingRow) {
        await googleSheetsService.updateData(SHEET_NAME, { ...formData, _rowIndex: editingRow._rowIndex });
      } else {
        await googleSheetsService.writeData(SHEET_NAME, formData);
      }
      setIsModalOpen(false);
      setEditingRow(null);
      setFormData(initialForm);
      fetchProducts();
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
      setProducts(prev => prev.filter(p => p._rowIndex !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert("Data ဖျက်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    (p.Product_Name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (p.Product_ID?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Product Master</h2>
          <p className="text-sm text-slate-500">Manage all items, pricing, and tax structures</p>
        </div>
        <button onClick={() => { setEditingRow(null); setFormData(initialForm); setIsModalOpen(true); }} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b flex items-center gap-4 bg-slate-50">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full max-w-sm px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4">Product ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Unit Price</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-brand-700">{p.Product_ID}</td>
                  <td className="p-4 font-medium">{p.Product_Name}</td>
                  <td className="p-4">{p.Category}</td>
                  <td className="p-4 text-right">${Number(p.Avg_Unit_Price).toLocaleString()}</td>
                  <td className="p-4 relative text-center">
                    <button onClick={() => setOpenMenuIndex(openMenuIndex === i ? null : i)} className="p-1 hover:bg-slate-200 rounded"><MoreHorizontal className="w-4 h-4"/></button>
                    {openMenuIndex === i && (
                      <div className="absolute right-12 top-2 w-32 bg-white shadow-xl border rounded-lg z-20 text-left">
                        <button onClick={() => { setEditingRow(p); setFormData(p); setIsModalOpen(true); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-slate-50"><Pencil className="w-4 h-4"/> Edit</button>
                        <button onClick={() => { setDeleteConfirmId(p._rowIndex); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-slate-50"><Trash2 className="w-4 h-4"/> Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl w-full max-w-4xl space-y-4 my-8">
            <h3 className="font-bold text-lg">{editingRow ? "Edit" : "New"} Product Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(initialForm).map((key) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase mb-1">{key.replace(/_/g, ' ')}</label>
                  <input name={key} value={formData[key]} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded">{isSubmitting ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}