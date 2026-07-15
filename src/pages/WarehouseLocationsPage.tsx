// src/pages/WarehouseLocationsPage.tsx

import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, MoreHorizontal, Pencil, Building2 } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';

export default function WarehouseLocationsPage() {
  const SHEET_NAME = '2_Warehouse_Locations';

  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    Location_ID: '', Location_Name: '', Location_Type: '', 
    Address: '', Manager_Name: '', Status: 'Active' 
  });

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const data = await googleSheetsService.readData(SHEET_NAME);
      setLocations(data);
    } catch (err) {
      alert("Warehouse Data ရယူရာတွင် အမှားအယွင်းရှိနေပါသည်။");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await googleSheetsService.writeData(SHEET_NAME, formData);
      setIsModalOpen(false);
      fetchLocations();
    } catch (err) {
      alert("Data သိမ်းဆည်းရန် အဆင်မပြေပါ။");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Warehouse Locations</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${loc.Status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {loc.Status}
              </span>
            </div>
            <h3 className="font-bold text-lg">{loc.Location_Name}</h3>
            <p className="text-sm text-slate-500 mb-2">{loc.Location_ID}</p>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
              <MapPin className="w-4 h-4 text-slate-400" /> {loc.Address}
            </div>
            <p className="text-sm font-medium mt-2">Manager: {loc.Manager_Name}</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4">
            <h3 className="font-bold text-lg">New Warehouse Location</h3>
            {Object.keys(formData).map((key) => (
              <div key={key}>
                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">{key.replace(/_/g, ' ')}</label>
                <input name={key} value={formData[key as keyof typeof formData]} onChange={(e) => setFormData({...formData, [key]: e.target.value})} className="w-full border p-2 rounded" required />
              </div>
            ))}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}