// src/pages/JournalVouchersPage.tsx

// ==========================================
// ၁။ လိုအပ်သော Packages နှင့် Icons များ ခေါ်ယူခြင်း
// ==========================================
import { useState, useEffect } from 'react';
import { Plus, Search, X, Pencil, Trash2, MoreHorizontal, Eye, ScrollText, CheckCircle2, AlertCircle } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';

export default function JournalVouchersPage() {
  // ==========================================
  // ၂။ State များ ကြေညာခြင်း (Variables)
  // ==========================================
  const SHEET_NAME = '8_Journal_Vouchers';

  const [jvs, setJvs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // ကုမ္ပဏီအမည် (ပြင်ဆင်လိုပါက ဤနေရာတွင် ပြင်နိုင်ပါသည်)
  const COMPANY_NAME = "The Insights Solution";

  // Database တွင်ရှိသော Column ၁၉ ခု အတိအကျကို Form State အဖြစ် သတ်မှတ်ခြင်း
  const initialForm = {
    Journal_No: '',
    Journal_Date: new Date().toISOString().split('T')[0],
    Project_Code: '',
    Project_Name: '',
    Account_Code: '',
    Account_Name: '',
    Contact_Name: '',
    Subject: '',
    Description: '',
    Currency: 'MMK',
    Exchange_Rate: '1',
    Debit: '0',
    Credit: '0',
    Base_Debit_MMK: '0',
    Base_Credit_MMK: '0',
    Reference_No: '',
    Remarks: '',
    'Invoice No': '',
    'Shortage No': ''
  };

  const [formData, setFormData] = useState<any>(initialForm);

  // ==========================================
  // ၃။ Data များ ဆွဲယူခြင်း (Fetch API)
  // ==========================================
  const fetchJVs = async () => {
    setIsLoading(true);
    try {
      const data = await googleSheetsService.readData(SHEET_NAME);
      setJvs(data);
    } catch (err) {
      alert("Journal Voucher Data များ ရယူရာတွင် အခက်အခဲရှိနေပါသည်။");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJVs();
  }, []);

  // ==========================================
  // ၄။ Input အပြောင်းအလဲများကို ဖမ်းယူ၍ Auto တွက်ချက်ခြင်း (MMK Conversion)
  // ==========================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: any) => {
      let newData = { ...prev, [name]: value };

      // Debit, Credit သို့မဟုတ် Exchange_Rate ပြောင်းလဲပါက Base MMK များကို Auto တွက်မည်
      if (['Debit', 'Credit', 'Exchange_Rate'].includes(name)) {
        const rate = parseFloat(newData.Exchange_Rate || '1');
        const dr = parseFloat(newData.Debit || '0');
        const cr = parseFloat(newData.Credit || '0');
        
        newData.Base_Debit_MMK = (dr * rate).toString();
        newData.Base_Credit_MMK = (cr * rate).toString();
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
      fetchJVs();
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
      setJvs(prev => prev.filter(p => p._rowIndex !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert("Data ဖျက်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (jv: any) => {
    setEditingRow(jv);
    setFormData(jv);
    setIsModalOpen(true);
  };

  // ==========================================
  // ၇။ Search Filter နှင့် 3 KPIs တွက်ချက်မှုများ
  // ==========================================
  const filteredJVs = jvs.filter(jv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (jv.Journal_No?.toLowerCase() || '').includes(query) ||
      (jv.Contact_Name?.toLowerCase() || '').includes(query) ||
      (jv.Subject?.toLowerCase() || '').includes(query) ||
      (jv.Account_Name?.toLowerCase() || '').includes(query)
    );
  });

  // KPI တွက်ချက်ခြင်း (Total Debit, Total Credit, Difference)
  const totalDebit = filteredJVs.reduce((sum, jv) => sum + Number(jv.Base_Debit_MMK || 0), 0);
  const totalCredit = filteredJVs.reduce((sum, jv) => sum + Number(jv.Base_Credit_MMK || 0), 0);
  const balanceDiff = totalDebit - totalCredit;

  // ==========================================
  // ၈။ UI ရေးဆွဲခြင်း (Main Render)
  // ==========================================
  return (
    <div className="space-y-6 relative">
      
      {/* ၈.၁ ခေါင်းစဉ်နှင့် Add ခလုတ် */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Journal Vouchers</h2>
          <p className="text-sm text-slate-500">Manage manual journal entries and adjustments</p>
        </div>
        <button onClick={() => { setEditingRow(null); setFormData(initialForm); setIsModalOpen(true); }} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-700 shadow-sm">
          <Plus className="w-4 h-4" /> Create Journal
        </button>
      </div>

      {/* ၈.၂ 3 KPIs Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Debit (MMK)</p>
            <p className="text-xl font-bold text-slate-800">{Number(totalDebit).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Credit (MMK)</p>
            <p className="text-xl font-bold text-slate-800">{Number(totalCredit).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${balanceDiff === 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            <AlertCircle className={`w-5 h-5 ${balanceDiff === 0 ? 'text-emerald-600' : 'text-rose-500'}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Out of Balance</p>
            <p className={`text-xl font-bold ${balanceDiff === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Number(balanceDiff).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ၈.၃ Search Bar နှင့် Table ဇယား */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" placeholder="Search by Journal No, Contact, Subject..." 
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
                <th className="px-4 py-3">Journal No.</th>
                <th className="px-4 py-3">Account Name</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3 text-right">Debit (Base)</th>
                <th className="px-4 py-3 text-right">Credit (Base)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {isLoading && jvs.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading Journals...</td></tr>
              ) : filteredJVs.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No Journal Vouchers found.</td></tr>
              ) : (
                filteredJVs.map((jv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">{jv.Journal_Date}</td>
                    <td className="px-4 py-3 font-bold text-brand-700">{jv.Journal_No}</td>
                    <td className="px-4 py-3">{jv.Account_Name} <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 ml-1">{jv.Account_Code}</span></td>
                    <td className="px-4 py-3 text-xs truncate max-w-[200px]" title={jv.Subject}>{jv.Subject}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">{Number(jv.Base_Debit_MMK).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-rose-600">{Number(jv.Base_Credit_MMK).toLocaleString()}</td>
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
                            <button onClick={() => { openEditModal(jv); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => { setDeleteConfirmId(jv._rowIndex); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
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
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Journal?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this Journal Entry?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700">{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ၉။ Journal Voucher Form Modal (As per provided image layout) */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200 border-2 border-brand-800">
            
            {/* Header Section (Logo, Title, Journal Info) */}
            <div className="p-6 border-b-2 border-brand-800 flex justify-between items-start">
              {/* Logo Area */}
              <div className="w-1/4 flex justify-center items-center">
                <img src="/images/tis_logo.png" alt="Logo" className="h-16 object-contain" />
              </div>
              
              {/* Title Area */}
              <div className="w-2/4 text-center space-y-1">
                <h2 className="text-xl font-bold tracking-wide">{COMPANY_NAME}</h2>
                <h3 className="text-lg font-semibold text-slate-700">Journal Details</h3>
              </div>
              
              {/* Journal Info Area */}
              <div className="w-1/4">
                <table className="w-full text-xs font-bold border-collapse border border-slate-800">
                  <tbody>
                    <tr>
                      <td className="border border-slate-800 p-1.5 bg-slate-50">Journal No.</td>
                      <td className="border border-slate-800 p-1.5"><input name="Journal_No" value={formData.Journal_No} onChange={handleInputChange} required className="w-full outline-none bg-transparent" /></td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 bg-slate-50">Journal Date</td>
                      <td className="border border-slate-800 p-1.5"><input type="date" name="Journal_Date" value={formData.Journal_Date} onChange={handleInputChange} required className="w-full outline-none bg-transparent" /></td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 bg-slate-50">Invoice No.</td>
                      <td className="border border-slate-800 p-1.5"><input name="Invoice No" value={formData['Invoice No']} onChange={handleInputChange} className="w-full outline-none bg-transparent" /></td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 bg-slate-50 text-red-600">Shortage No.</td>
                      <td className="border border-slate-800 p-1.5"><input name="Shortage No" value={formData['Shortage No']} onChange={handleInputChange} className="w-full outline-none bg-transparent text-red-600" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Contact & Subject Section */}
              <div className="border-b-2 border-brand-800">
                <table className="w-full text-sm font-bold border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-400">
                      <td className="w-32 p-2 border-r border-slate-400 bg-slate-50">Name</td>
                      <td className="p-2"><input name="Contact_Name" value={formData.Contact_Name} onChange={handleInputChange} className="w-full outline-none bg-transparent" placeholder="e.g. Jotun Myanmar Co; Ltd" /></td>
                    </tr>
                    <tr>
                      <td className="w-32 p-2 border-r border-slate-400 bg-slate-50">Subject</td>
                      <td className="p-2"><input name="Subject" value={formData.Subject} onChange={handleInputChange} className="w-full outline-none bg-transparent" placeholder="Subject details..." /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Line Items Section (Mini Table Layout for Data Entry) */}
              <div className="border-b-2 border-brand-800">
                <div className="bg-slate-50 flex text-[11px] font-bold text-center border-b border-brand-800">
                  <div className="w-[12%] p-2 border-r border-slate-400">Project Code</div>
                  <div className="w-[15%] p-2 border-r border-slate-400">Project Name</div>
                  <div className="w-[20%] p-2 border-r border-slate-400">Particular (Desc)</div>
                  <div className="w-[10%] p-2 border-r border-slate-400">A/C No</div>
                  <div className="w-[15%] p-2 border-r border-slate-400">A/C Name</div>
                  <div className="w-[10%] p-2 border-r border-slate-400">Dr (Amount)</div>
                  <div className="w-[10%] p-2 border-r border-slate-400">Cr (Amount)</div>
                  <div className="w-[8%] p-2">Remark</div>
                </div>
                
                {/* Single Row Data Entry */}
                <div className="flex text-xs bg-white">
                  <div className="w-[12%] p-1 border-r border-slate-200">
                    <input name="Project_Code" value={formData.Project_Code} onChange={handleInputChange} className="w-full p-1 border rounded" />
                  </div>
                  <div className="w-[15%] p-1 border-r border-slate-200">
                    <input name="Project_Name" value={formData.Project_Name} onChange={handleInputChange} className="w-full p-1 border rounded" />
                  </div>
                  <div className="w-[20%] p-1 border-r border-slate-200">
                    <textarea name="Description" value={formData.Description} onChange={handleInputChange} rows={2} className="w-full p-1 border rounded resize-none" />
                  </div>
                  <div className="w-[10%] p-1 border-r border-slate-200">
                    <input name="Account_Code" value={formData.Account_Code} onChange={handleInputChange} required className="w-full p-1 border rounded font-mono text-center" />
                  </div>
                  <div className="w-[15%] p-1 border-r border-slate-200">
                    <textarea name="Account_Name" value={formData.Account_Name} onChange={handleInputChange} required rows={2} className="w-full p-1 border rounded resize-none" />
                  </div>
                  <div className="w-[10%] p-1 border-r border-slate-200">
                    <input type="number" name="Debit" value={formData.Debit} onChange={handleInputChange} className="w-full p-1 border rounded text-right text-emerald-700 font-bold" min="0" step="0.01" />
                  </div>
                  <div className="w-[10%] p-1 border-r border-slate-200">
                    <input type="number" name="Credit" value={formData.Credit} onChange={handleInputChange} className="w-full p-1 border rounded text-right text-rose-700 font-bold" min="0" step="0.01" />
                  </div>
                  <div className="w-[8%] p-1">
                    <textarea name="Remarks" value={formData.Remarks} onChange={handleInputChange} rows={2} className="w-full p-1 border rounded resize-none" />
                  </div>
                </div>
              </div>

              {/* FX & Ref Area */}
              <div className="bg-slate-50 p-4 border-b-2 border-brand-800 flex flex-wrap gap-4 items-center text-sm">
                 <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-700">Currency:</label>
                    <select name="Currency" value={formData.Currency} onChange={handleInputChange} className="border p-1.5 rounded outline-none">
                      <option value="MMK">MMK</option>
                      <option value="USD">USD</option>
                      <option value="SGD">SGD</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-700">Exchange Rate:</label>
                    <input type="number" name="Exchange_Rate" value={formData.Exchange_Rate} onChange={handleInputChange} className="border p-1.5 rounded outline-none w-24 text-right" disabled={formData.Currency === 'MMK'} step="0.01" />
                 </div>
                 <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-700">Ref No:</label>
                    <input name="Reference_No" value={formData.Reference_No} onChange={handleInputChange} className="border p-1.5 rounded outline-none" />
                 </div>
              </div>

              {/* Total Calculation Area */}
              <div className="flex justify-end p-4 bg-white border-b border-slate-200">
                <table className="w-1/3 text-sm font-bold border-collapse border border-slate-800">
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-800 text-center bg-slate-50 w-1/3">Base Dr(MMK)</td>
                      <td className="p-2 border border-slate-800 text-right text-emerald-700">{Number(formData.Base_Debit_MMK).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-800 text-center bg-slate-50">Base Cr(MMK)</td>
                      <td className="p-2 border border-slate-800 text-right text-rose-700">{Number(formData.Base_Credit_MMK).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 flex justify-between items-center">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-white bg-transparent transition-colors">
                  Close / Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-2 font-bold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors shadow-md">
                  {isSubmitting ? 'Saving...' : 'Save Journal Entry'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}