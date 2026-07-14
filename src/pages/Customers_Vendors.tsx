// src/pages/CustomersVendors.tsx

// ==========================================
// ၁။ လိုအပ်သော Packages နှင့် Services များကို ခေါ်ယူခြင်း
// ==========================================
import { useState, useEffect } from 'react';
import { Plus, Search, X, Pencil, Trash2, Users } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';

export default function CustomersVendors() {
  // 🌟 Google Sheet အမည်
  const SHEET_NAME = '9_Partners';

  // ==========================================
  // ၂။ State များ ကြေညာခြင်း
  // ==========================================
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal နှင့် Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete Confirmation States
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Form တွင် အသုံးပြုမည့် မူလ Data ပုံစံ (Columns ၁၄ ခု)
  const initialForm = {
    Partner_ID: '',
    Partner_Name: '',
    Shipping_Address: '',
    Billing_Address: '',
    Email_Address: '',
    Phone_Number: '',
    Contact_Person: '',
    Description: '',
    Total_Sales: '',
    Sales_Rank: '',
    Total_Purchases: '',
    Purchase_Rank: '',
    Partner_Type: 'Customer', // Default: Customer, Vendor, or Both
    Status: 'Active' // Default: Active or Inactive
  };

  const [formData, setFormData] = useState(initialForm);

  // ==========================================
  // ၃။ Data ဆွဲယူခြင်း (Fetch Data)
  // ==========================================
  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const data = await googleSheetsService.readData(SHEET_NAME);
      setPartners(data);
    } catch (err) {
      setError("စာရင်းများ ရယူရာတွင် အခက်အခဲရှိနေပါသည်။");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // ==========================================
  // ၄။ Form Actions (Input Change & Submit)
  // ==========================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingRow) {
        // Edit
        const payload = { ...formData, _rowIndex: editingRow._rowIndex };
        await googleSheetsService.updateData(SHEET_NAME, payload);
      } else {
        // Add New
        await googleSheetsService.writeData(SHEET_NAME, formData);
      }
      setIsModalOpen(false);
      setEditingRow(null);
      setFormData(initialForm);
      fetchPartners();
    } catch (err) {
      alert("ဒေတာ သိမ်းဆည်းရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
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
      await googleSheetsService.deleteData(SHEET_NAME, deleteConfirmId);
      setPartners(prev => prev.filter(p => p._rowIndex !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert("ဒေတာ ဖျက်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsDeleting(false);
    }
  };

  // Modal အဖွင့်အပိတ် Functions
  const openEditModal = (partner: any) => {
    setEditingRow(partner);
    setFormData({
      Partner_ID: partner.Partner_ID || '',
      Partner_Name: partner.Partner_Name || '',
      Shipping_Address: partner.Shipping_Address || '',
      Billing_Address: partner.Billing_Address || '',
      Email_Address: partner.Email_Address || '',
      Phone_Number: partner.Phone_Number || '',
      Contact_Person: partner.Contact_Person || '',
      Description: partner.Description || '',
      Total_Sales: partner.Total_Sales || '',
      Sales_Rank: partner.Sales_Rank || '',
      Total_Purchases: partner.Total_Purchases || '',
      Purchase_Rank: partner.Purchase_Rank || '',
      Partner_Type: partner.Partner_Type || 'Customer',
      Status: partner.Status || 'Active'
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingRow(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  // ==========================================
  // ၆။ Search Filter
  // ==========================================
  const filteredPartners = partners.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (p.Partner_ID?.toLowerCase() || '').includes(query) ||
      (p.Partner_Name?.toLowerCase() || '').includes(query) ||
      (p.Phone_Number?.toLowerCase() || '').includes(query) ||
      (p.Contact_Person?.toLowerCase() || '').includes(query) ||
      (p.Partner_Type?.toLowerCase() || '').includes(query)
    );
  });

  // ==========================================
  // ၇။ UI Render အပိုင်း
  // ==========================================
  return (
    <div className="space-y-6 relative">
      
      {/* ၇.၁ ခေါင်းစဉ်နှင့် Add ခလုတ် */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Customers & Vendors</h2>
            <p className="text-sm text-slate-500">Manage your business partners, clients, and suppliers.</p>
          </div>
        </div>
        <button onClick={openAddModal} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-700 shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Partner
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* ၇.၂ Search Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" placeholder="Search by ID, name, phone, contact..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>

        {/* ၇.၃ Table ဇယား (ကော်လံများပြားသဖြင့် overflow-x-auto ထားပါသည်) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Partner ID</th>
                <th className="px-4 py-3 min-w-[150px]">Partner Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 min-w-[150px]">Contact Info</th>
                <th className="px-4 py-3 min-w-[200px]">Billing Address</th>
                <th className="px-4 py-3 min-w-[200px]">Shipping Address</th>
                <th className="px-4 py-3 text-right">Total Sales (Rank)</th>
                <th className="px-4 py-3 text-right">Total Purch (Rank)</th>
                <th className="px-4 py-3 min-w-[150px]">Description</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center sticky right-0 bg-slate-50 border-l border-slate-200 shadow-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {isLoading && partners.length === 0 ? (
                 <tr><td colSpan={11} className="px-6 py-8 text-center text-slate-500">Loading partners...</td></tr>
              ) : filteredPartners.length === 0 ? (
                 <tr><td colSpan={11} className="px-6 py-8 text-center text-slate-500">No partners found.</td></tr>
              ) : (
                filteredPartners.map((partner, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">{partner.Partner_ID}</td>
                    <td className="px-4 py-3 font-medium whitespace-normal break-words">{partner.Partner_Name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium 
                        ${partner.Partner_Type === 'Customer' ? 'bg-blue-50 text-blue-600' : 
                          partner.Partner_Type === 'Vendor' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>
                        {partner.Partner_Type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] leading-relaxed">
                      <div className="font-medium text-slate-700">{partner.Contact_Person || '-'}</div>
                      <div className="text-slate-500">📞 {partner.Phone_Number || '-'}</div>
                      <div className="text-slate-500">✉️ {partner.Email_Address || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-normal max-w-[200px]">{partner.Billing_Address || '-'}</td>
                    <td className="px-4 py-3 text-xs whitespace-normal max-w-[200px]">{partner.Shipping_Address || '-'}</td>
                    
                    <td className="px-4 py-3 text-right">
                      <div className="font-mono text-emerald-600">{partner.Total_Sales ? Number(partner.Total_Sales).toLocaleString() : '-'}</div>
                      <div className="text-[10px] text-slate-400">Rank: {partner.Sales_Rank || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-mono text-rose-600">{partner.Total_Purchases ? Number(partner.Total_Purchases).toLocaleString() : '-'}</div>
                      <div className="text-[10px] text-slate-400">Rank: {partner.Purchase_Rank || '-'}</div>
                    </td>
                    
                    <td className="px-4 py-3 text-xs truncate max-w-[150px]" title={partner.Description}>{partner.Description || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${partner.Status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {partner.Status || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex justify-center gap-2 items-center h-full sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-100 transition-colors">
                      <button onClick={() => openEditModal(partner)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                        <Pencil className="w-4 h-4"/>
                      </button>
                      <button onClick={() => setDeleteConfirmId(partner._rowIndex)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete">
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

      {/* ၇.၄ Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 text-center animate-fade-in">
            <Trash2 className="w-12 h-12 text-rose-500 mx-auto mb-4 bg-rose-50 p-2 rounded-full" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Partner?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this partner record? This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-70">
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ၇.၅ Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl my-8 animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-800">{editingRow ? "Edit Partner Info" : "New Partner"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Section 1: Basic Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Partner ID <span className="text-rose-500">*</span></label>
                    <input type="text" name="Partner_ID" value={formData.Partner_ID} onChange={handleInputChange} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Partner Name <span className="text-rose-500">*</span></label>
                    <input type="text" name="Partner_Name" value={formData.Partner_Name} onChange={handleInputChange} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    <select name="Partner_Type" value={formData.Partner_Type} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                      <option value="Customer">Customer</option>
                      <option value="Vendor">Vendor</option>
                      <option value="Both">Both (Cust & Vend)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                    <input type="text" name="Contact_Person" value={formData.Contact_Person} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
                    <input type="text" name="Phone_Number" value={formData.Phone_Number} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                    <input type="email" name="Email_Address" value={formData.Email_Address} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                  </div>
                </div>
              </div>

              {/* Section 3: Address & Extra Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Addresses & Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Billing Address</label>
                    <textarea name="Billing_Address" rows={2} value={formData.Billing_Address} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Shipping Address</label>
                    <textarea name="Shipping_Address" rows={2} value={formData.Shipping_Address} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Description / Additional Info</label>
                    <input type="text" name="Description" value={formData.Description} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                    <select name="Status" value={formData.Status} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Analytics (Optional Fields from Report) */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Ranking & History (Optional)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Total Sales</label>
                    <input type="number" step="any" name="Total_Sales" value={formData.Total_Sales} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Sales Rank</label>
                    <input type="text" name="Sales_Rank" value={formData.Sales_Rank} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Total Purchases</label>
                    <input type="number" step="any" name="Total_Purchases" value={formData.Total_Purchases} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Purchase Rank</label>
                    <input type="text" name="Purchase_Rank" value={formData.Purchase_Rank} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-70">
                  {isSubmitting ? 'Saving...' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}