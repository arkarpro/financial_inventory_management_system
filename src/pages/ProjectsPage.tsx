// src/pages/ProjectsPage.tsx

// ==========================================
// ၁။ လိုအပ်သော Packages နှင့် Icons များ ခေါ်ယူခြင်း
// ==========================================
import { useState, useEffect } from 'react';
import { Plus, Search, X, Pencil, Trash2, MoreHorizontal, FolderKanban, CheckCircle2, DollarSign } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';

export default function ProjectsPage() {
  // ==========================================
  // ၂။ State များ ကြေညာခြင်း (Variables)
  // ==========================================
  const SHEET_NAME = '10_Projects';

  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // Database ရှိ ကော်လံ (၇) ခု အတိအကျကို Form State အဖြစ် သတ်မှတ်ခြင်း
  const initialForm = {
    Project_Code: '',
    Project_Name: '',
    Start_Date: new Date().toISOString().split('T')[0],
    End_Date: '',
    Status: 'Active',
    Budget_Amount: '0',
    Description: ''
  };

  const [formData, setFormData] = useState<any>(initialForm);

  // ==========================================
  // ၃။ Data များ ဆွဲယူခြင်း (Fetch API)
  // ==========================================
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await googleSheetsService.readData(SHEET_NAME);
      setProjects(data);
    } catch (err) {
      alert("Project Data များ ရယူရာတွင် အခက်အခဲရှိနေပါသည်။");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // ==========================================
  // ၄။ Input အပြောင်းအလဲများကို ဖမ်းယူခြင်း
  // ==========================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
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
      fetchProjects();
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
      setProjects(prev => prev.filter(p => p._rowIndex !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert("Data ဖျက်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (project: any) => {
    setEditingRow(project);
    setFormData({
      ...project,
      Start_Date: project.Start_Date ? new Date(project.Start_Date).toISOString().split('T')[0] : '',
      End_Date: project.End_Date ? new Date(project.End_Date).toISOString().split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  // ==========================================
  // ၇။ Search Filter နှင့် 3 KPIs တွက်ချက်မှုများ
  // ==========================================
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (project.Project_Code?.toLowerCase() || '').includes(query) ||
      (project.Project_Name?.toLowerCase() || '').includes(query) ||
      (project.Status?.toLowerCase() || '').includes(query)
    );
  });

  // KPI တွက်ချက်ခြင်း
  const totalProjects = filteredProjects.length;
  const activeProjects = filteredProjects.filter(p => p.Status === 'Active').length;
  const totalBudget = filteredProjects.reduce((sum, p) => sum + Number(p.Budget_Amount || 0), 0);

  // ==========================================
  // ၈။ UI ရေးဆွဲခြင်း (Main Render)
  // ==========================================
  return (
    <div className="space-y-6 relative">
      
      {/* ၈.၁ ခေါင်းစဉ်နှင့် Add ခလုတ် */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Projects / Cost Centers</h2>
          <p className="text-sm text-slate-500">Manage project records and budget allocations</p>
        </div>
        <button onClick={() => { setEditingRow(null); setFormData(initialForm); setIsModalOpen(true); }} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {/* ၈.၂ 3 KPIs Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Projects</p>
            <p className="text-xl font-bold text-slate-800">{totalProjects}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Projects</p>
            <p className="text-xl font-bold text-slate-800">{activeProjects}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Budget (Est.)</p>
            <p className="text-xl font-bold text-slate-800">{Number(totalBudget).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ၈.၃ Search Bar နှင့် Table ဇယား */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" placeholder="Search by Project Code or Name..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3">Project Code</th>
                <th className="px-4 py-3">Project Name</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3 text-right">Budget</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {isLoading && projects.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading Projects...</td></tr>
              ) : filteredProjects.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No Projects found.</td></tr>
              ) : (
                filteredProjects.map((project, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-brand-700">{project.Project_Code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{project.Project_Name}</td>
                    <td className="px-4 py-3 text-slate-500">{project.Start_Date ? new Date(project.Start_Date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{project.End_Date ? new Date(project.End_Date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(project.Budget_Amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider 
                        ${project.Status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                          project.Status === 'Completed' ? 'bg-blue-100 text-blue-700' : 
                          'bg-amber-100 text-amber-700'}`}>
                        {project.Status}
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
                            <button onClick={() => { openEditModal(project); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => { setDeleteConfirmId(project._rowIndex); setOpenMenuIndex(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
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
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Project?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this project? Data linked to this project code may be affected.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700">{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ၉။ Project Form Modal */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">{editingRow ? "Edit Project" : "New Project"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Project Code <span className="text-rose-500">*</span></label>
                  <input name="Project_Code" value={formData.Project_Code} onChange={handleInputChange} required placeholder="e.g. PRJ-001" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Project Name <span className="text-rose-500">*</span></label>
                  <input name="Project_Name" value={formData.Project_Name} onChange={handleInputChange} required placeholder="e.g. Yangon Factory Expansion" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Start Date</label>
                  <input type="date" name="Start_Date" value={formData.Start_Date} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">End Date</label>
                  <input type="date" name="End_Date" value={formData.End_Date} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Status</label>
                  <select name="Status" value={formData.Status} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Budget Amount</label>
                  <input type="number" name="Budget_Amount" value={formData.Budget_Amount} onChange={handleInputChange} placeholder="0.00" min="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Description / Remarks</label>
                <textarea name="Description" value={formData.Description} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none" placeholder="Add any notes about this project..."></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-md transition-colors disabled:opacity-70">
                  {isSubmitting ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}