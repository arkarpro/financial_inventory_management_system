// src/pages/CashBankPage.tsx

// ==========================================
// ၁။ လိုအပ်သော Packages နှင့် Services များကို ခေါ်ယူခြင်း (Imports)
// ==========================================
import { useState, useEffect } from 'react';
import { Plus, Search, Download, RefreshCw, X, Pencil, Trash2, ArrowRight, ArrowDownRight, ArrowUpRight, Wallet, MoreHorizontal, Eye } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';

export default function CashBankPage() {
  // ==========================================
  // ၂။ State များ ကြေညာခြင်း (Variables)
  // ==========================================
  
  // ၂.၁ Table တွင်ပြသမည့် Data များ
  const [transactions, setTransactions] = useState<any[]>([]);
  const [coaList, setCoaList] = useState<any[]>([]);
  
  // ၂.၂ Loading နှင့် Error အခြေအနေများ
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ၂.၃ Modal (Form Box) အဖွင့်အပိတ် နှင့် Submit အခြေအနေများ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ၂.၄ Search Bar နှင့် Delete Popup အတွက် States များ
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 🟢 3-dots menu အဖွင့်အပိတ်အတွက် State အသစ်
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  
  // ၂.၅ Transaction အမျိုးအစား (Expense, Income, Transfer)
  const [txnType, setTxnType] = useState<'Expense' | 'Income' | 'Transfer'>('Expense');

  // ==========================================
  // ၂.၆ Form တွင် အသုံးပြုမည့် မူလအလွတ် Data ပုံစံ
  // ==========================================
  const initialForm = {
    Date: new Date().toISOString().split('T')[0],
    Voucher_No: '',
    Reference_No: '',
    Project_Code: '',
    Receiver: '', 
    Description: '',
    Book_Name: '',    
    From_Book: '',    
    To_Book: '',      
    Account_Code: '', 
    Txn_Currency: 'MMK',
    Exchange_Rate: '1',
    Amount: '',       
    To_Amount: '',
    Base_Amount_MMK: '' // 🟢 အသစ်တိုးထားသည် 🟢
  };

  const [formData, setFormData] = useState(initialForm);

  // Edit Modal ဖွင့်ရန် Function (Hardcoded Currency အမှားကို ပြင်ဆင်ထားသည်)
  const openEditModal = (txn: any) => {
    setEditingRow(txn);
    let type: 'Expense' | 'Income' | 'Transfer' = 'Expense';
    if (txn.Account_Name === 'Fund Transfer') type = 'Transfer';
    else if (txn.Account_Code_Debit === getBookAccountCode(txn.Book)) type = 'Income';
    
    setTxnType(type);
    
    // Book Name ထဲမှ Currency ခွဲထုတ်ခြင်း
    const bookName = txn.Book || '';
    const currency = bookName ? String(bookName).slice(-3).toUpperCase() : 'MMK';
    const isForeign = ['USD', 'SGD'].includes(currency);

    setFormData({
      Date: txn.Date ? new Date(txn.Date).toISOString().split('T')[0] : '',
      Voucher_No: txn.Voucher_No || '',
      Reference_No: txn.Reference_No || '',
      Project_Code: txn.Project_Code || '',
      Receiver: txn.Receiver || '',
      Description: txn.Description || '',
      Book_Name: type !== 'Transfer' ? bookName : '',
      From_Book: type === 'Transfer' ? bookName : '',
      To_Book: '', 
      Account_Code: type === 'Expense' ? txn.Account_Code_Debit : txn.Account_Code_Credit,
      Txn_Currency: isForeign ? currency : 'MMK', // 🟢 Edit ချိန်တွင် Currency အမှန်ပေါ်စေမည် 🟢
      Exchange_Rate: txn.Exchange_Rate_USD || txn.Exchange_Rate_SGD || '1',
      Amount: txn.Amount_USD || txn.Amount_SGD || txn.Amount_MMK || '',
      To_Amount: '',
      Base_Amount_MMK: txn.Amount_MMK || '' // 🟢 Edit ချိန်တွင် Base MMK ကို ယူမည် 🟢
    });
    setIsModalOpen(true);
  };

  // ==========================================
  // ၃။ Data ဆွဲယူခြင်း (Fetch Data)
  // ==========================================
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [txnData, coaData] = await Promise.all([
        googleSheetsService.readData('5_Cash_And_Bank'),
        googleSheetsService.readData('1_Chart_Of_Accounts').catch(() => [])
      ]);
      setTransactions(txnData);
      setCoaList(coaData);
    } catch (err) {
      setError("ဒေတာများ ရယူရာတွင် အခက်အခဲရှိနေပါသည်။");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  // ==========================================
  // ၄။ Helper Functions (အကူအညီပေးသော Functions များ)
  // ==========================================
  
  // ၄.၁ COA ထဲမှ Book ဖြစ်သော စာရင်းများနှင့်၊ သာမန် Account များကို ခွဲထုတ်ခြင်း
  const bookAccounts = coaList.filter((a: any) => a.Book && String(a.Book).trim() !== '');
  const generalAccounts = coaList.filter((a: any) => !a.Book || String(a.Book).trim() === '');

  // ၄.၂ Book Name ကိုပေးလိုက်လျှင် သူ၏ Account Code ကို ရှာပေးမည့် Function
  const getBookAccountCode = (bookName: string) => {
    const book = bookAccounts.find((a: any) => a.Book === bookName);
    return book ? book.Account_Code : '';
  };

  // ၄.၃ Account Code ကိုပေးလိုက်လျှင် အသေးစိတ်အချက်အလက်ကို ရှာပေးမည့် Function
  const getGeneralAccount = (code: string) => {
    return generalAccounts.find((a: any) => String(a.Account_Code) === String(code)) || {};
  };

  // ==========================================
  // ၅။ တွက်ချက်မှုများ (Calculations - Base MMK)
  // ==========================================
  const calculateBaseMMK = () => {
    if (txnType === 'Transfer') {
      const fromCurr = formData.From_Book ? String(formData.From_Book).slice(-3).toUpperCase() : '';
      const toCurr = formData.To_Book ? String(formData.To_Book).slice(-3).toUpperCase() : '';
      
      if (fromCurr === 'MMK') return parseFloat(formData.Amount || '0');
      if (toCurr === 'MMK') return parseFloat(formData.To_Amount || '0');
      
      return parseFloat(formData.Amount || '0') * parseFloat(formData.Exchange_Rate || '1');
    } else {
      return parseFloat(formData.Amount || '0') * parseFloat(formData.Exchange_Rate || '1');
    }
  };

  // ==========================================
  // ၆။ Input အပြောင်းအလဲများကို ဖမ်းယူခြင်း (Handle Inputs)
  // ==========================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: any) => {
      let newData = { ...prev, [name]: value };

      // Book ပြောင်းလျှင် Currency နှင့် Exchange Rate သတ်မှတ်ခြင်း
      if (name === 'Book_Name' || name === 'From_Book') {
        const currency = value.slice(-3).toUpperCase();
        const isForeign = ['USD', 'SGD'].includes(currency);
        newData.Txn_Currency = isForeign ? currency : 'MMK';
        newData.Exchange_Rate = isForeign ? prev.Exchange_Rate : '1';
        
        // Base MMK ကို ချက်ချင်းပြန်တွက်မည်
        newData.Base_Amount_MMK = (parseFloat(newData.Amount || '0') * parseFloat(newData.Exchange_Rate || '1')).toString();
      }

      // Amount သို့မဟုတ် Exchange_Rate ပြင်လျှင် Base MMK ကို Auto တွက်မည်
      if (name === 'Amount' || name === 'Exchange_Rate') {
        newData.Base_Amount_MMK = (parseFloat(newData.Amount || '0') * parseFloat(newData.Exchange_Rate || '1')).toString();
      }

      return newData;
    });
  };

  // ==========================================
  // ၇။ Form Data သိမ်းဆည်းခြင်း (Submit/Save Transaction)
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 🟢 Auto တွက်ထားသည့် သို့မဟုတ် User ပြင်ထားသည့် Base Amount ကို တိုက်ရိုက်ယူမည် 🟢
      const base_mmk = parseFloat(formData.Base_Amount_MMK || '0'); 
      let isUSD = false, isSGD = false;
      let foreignAmount = '';

      // Currency တွက်ချက်ခြင်း
      if (txnType === 'Transfer') {
        const fromCurr = formData.From_Book ? String(formData.From_Book).slice(-3).toUpperCase() : '';
        const toCurr = formData.To_Book ? String(formData.To_Book).slice(-3).toUpperCase() : '';
        if (fromCurr === 'USD' || toCurr === 'USD') { isUSD = true; foreignAmount = fromCurr === 'USD' ? formData.Amount : formData.To_Amount; }
        if (fromCurr === 'SGD' || toCurr === 'SGD') { isSGD = true; foreignAmount = fromCurr === 'SGD' ? formData.Amount : formData.To_Amount; }
      } else {
        isUSD = formData.Txn_Currency === 'USD';
        isSGD = formData.Txn_Currency === 'SGD';
        foreignAmount = formData.Amount;
      }

      // Google Sheet သို့ပို့မည့် Data ပုံစံ (Payload)
      let payload: any = {
        Date: formData.Date,
        Voucher_No: formData.Voucher_No,
        Reference_No: formData.Reference_No,
        Project_Code: formData.Project_Code,
        Receiver: formData.Receiver,
        Description: formData.Description,
        Amount_MMK: base_mmk,
        Amount_USD: isUSD ? foreignAmount : '',
        Amount_SGD: isSGD ? foreignAmount : '',
        Exchange_Rate_USD: isUSD ? formData.Exchange_Rate : '',
        Exchange_Rate_SGD: isSGD ? formData.Exchange_Rate : '',
      };

      // ၇.၁ Income/Expense နှင့် Transfer Logic အသစ်များ
      if (txnType === 'Income') {
        // Income = Debit: Cash Book, Credit: Income Account
        const genAcc = getGeneralAccount(formData.Account_Code); 
        payload.Book = formData.Book_Name;
        payload.Account_Code_Debit = getBookAccountCode(formData.Book_Name); // Book ရဲ့ Account Code
        payload.Account_Code_Credit = formData.Account_Code; // ရွေးထားတဲ့ Income Code
        payload.Account_Name = genAcc.Account_Name || 'Income';
        payload.Class_Of_Account = genAcc.Class_Of_Account || 'Income';
      } 
      else if (txnType === 'Expense') {
        // Expense = Debit: Expense Account, Credit: Cash Book
        const genAcc = getGeneralAccount(formData.Account_Code);
        payload.Book = formData.Book_Name;
        payload.Account_Code_Debit = formData.Account_Code; // ရွေးထားတဲ့ Expense Code
        payload.Account_Code_Credit = getBookAccountCode(formData.Book_Name); // Book ရဲ့ Account Code
        payload.Account_Name = genAcc.Account_Name || 'Expense';
        payload.Class_Of_Account = genAcc.Class_Of_Account || 'Expense';
      } 
      else if (txnType === 'Transfer') {
        // Transfer = Debit: To Book, Credit: From Book
        payload.Book = formData.From_Book; 
        payload.Account_Code_Debit = getBookAccountCode(formData.To_Book);
        payload.Account_Code_Credit = getBookAccountCode(formData.From_Book);
        payload.Account_Name = 'Fund Transfer';
        payload.Class_Of_Account = 'Asset Transfer';
      }

      // Data ပို့ခြင်း
      if (editingRow) {
        payload._rowIndex = editingRow._rowIndex;
        await googleSheetsService.updateData('5_Cash_And_Bank', payload);
      } else {
        await googleSheetsService.writeData('5_Cash_And_Bank', payload);
      }

      setIsModalOpen(false);
      setEditingRow(null);
      setFormData(initialForm);
      setTxnType('Expense');
      fetchAllData();
    } catch (err) {
      alert("Error saving data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // ၈။ ဖျက်ရန် အတည်ပြုခြင်း (Delete Action)
  // ==========================================
  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    setIsDeleting(true);
    try {
      await googleSheetsService.deleteData('5_Cash_And_Bank', deleteConfirmId);
      setTransactions((prev: any[]) => prev.filter((t: any) => t._rowIndex !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert("Error deleting data.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddModal = () => {
    setEditingRow(null);
    setFormData(initialForm);
    setTxnType('Expense');
    setIsModalOpen(true);
  };

  // ==========================================
  // ၉။ Search Filter (ရှာဖွေခြင်း)
  // ==========================================
  const filteredTransactions = transactions.filter((txn: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (txn.Voucher_No?.toLowerCase() || '').includes(query) ||
      (txn.Description?.toLowerCase() || '').includes(query) ||
      (txn.Receiver?.toLowerCase() || '').includes(query) ||
      (txn.Book?.toLowerCase() || '').includes(query)
    );
  });

  // ==========================================
  // ၉.၅ Summary KPI တွက်ချက်ခြင်း (KPI Calculations)
  // ==========================================
  const totalReceipts = filteredTransactions.reduce((sum: number, txn: any) => {
    // Book Account သည် Debit ဘက်တွင်ရှိလျှင် Income (Receipt) အဖြစ် သတ်မှတ်သည်
    const isIncome = txn.Account_Code_Debit === getBookAccountCode(txn.Book);
    return isIncome ? sum + Number(txn.Amount_MMK || 0) : sum;
  }, 0);

  const totalPayments = filteredTransactions.reduce((sum: number, txn: any) => {
    // Book Account သည် Credit ဘက်တွင်ရှိလျှင် Expense (Payment) အဖြစ် သတ်မှတ်သည်
    const isExpense = txn.Account_Code_Credit === getBookAccountCode(txn.Book);
    return isExpense ? sum + Number(txn.Amount_MMK || 0) : sum;
  }, 0);

  const netCash = totalReceipts - totalPayments;
  // ==========================================
  // ၁၀။ UI ရေးဆွဲခြင်း (Render)
  // ==========================================
  return (
    <div className="space-y-6 relative">
      
      {/* ၁၀.၁ ခေါင်းစဉ်နှင့် Action ခလုတ်များ */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cash & Bank (Double Entry)</h2>
          <p className="text-sm text-slate-500">Manage Multi-Currency Receipts, Payments & Transfers</p>
        </div>
        <button onClick={openAddModal} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

        {/* 🟢 ၁၀.၁.၅ Summary KPI Cards အသစ် 🟢 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Receipts</p>
            <p className="text-xl font-bold text-slate-800">{Number(totalReceipts).toLocaleString()} <span className="text-sm font-normal text-slate-500">MMK</span></p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-rose-50 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Payments</p>
            <p className="text-xl font-bold text-slate-800">{Number(totalPayments).toLocaleString()} <span className="text-sm font-normal text-slate-500">MMK</span></p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${netCash >= 0 ? 'bg-brand-50' : 'bg-red-50'}`}>
            <Wallet className={`w-5 h-5 ${netCash >= 0 ? 'text-brand-600' : 'text-red-500'}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Net Cash Flow</p>
            <p className={`text-xl font-bold ${netCash >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
              {netCash >= 0 ? '+' : ''}{Number(netCash).toLocaleString()} <span className="text-sm font-normal opacity-70">MMK</span>
            </p>
          </div>
        </div>
      </div>
        
        {/* ၁၀.၂ Search Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" placeholder="Search by Voucher No, Description or Book..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* ၁၀.၃ Table ဇယား */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Voucher No</th>
                <th className="px-4 py-3">Book</th>
                <th className="px-4 py-3 text-emerald-600">Debit A/C</th>
                <th className="px-4 py-3 text-rose-600">Credit A/C</th>
                <th className="px-4 py-3">A/C Name</th>
                <th className="px-4 py-3 text-right">Base (MMK)</th>
                <th className="px-4 py-3 text-center">FX Info</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {isLoading && transactions.length === 0 ? (
                 <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">Loading transactions...</td></tr>
              ) : filteredTransactions.length === 0 ? (
                 <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">No matching transactions found.</td></tr>
              ) : (
                filteredTransactions.map((txn, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{txn.Date ? new Date(txn.Date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{txn.Voucher_No}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{txn.Book}</span></td>
                    <td className="px-4 py-3 font-mono text-emerald-600">{txn.Account_Code_Debit}</td>
                    <td className="px-4 py-3 font-mono text-rose-600">{txn.Account_Code_Credit}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]" title={txn.Account_Name}>{txn.Account_Name}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{txn.Amount_MMK ? Number(txn.Amount_MMK).toLocaleString() : '0'}</td>
                    <td className="px-4 py-3 text-center">
                      {txn.Amount_USD ? <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">USD: {txn.Amount_USD} (@{txn.Exchange_Rate_USD})</span> : 
                       txn.Amount_SGD ? <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">SGD: {txn.Amount_SGD} (@{txn.Exchange_Rate_SGD})</span> : '-'}
                    </td>
                    <td className="px-4 py-3 relative text-center">
                      <button
                        onClick={() => setOpenMenuIndex(openMenuIndex === idx ? null : idx)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 mx-auto" />
                      </button>
                      
                      {openMenuIndex === idx && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuIndex(null)} />
                          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 bg-white rounded-lg shadow-xl border border-slate-200 z-20 py-1 animate-fade-in text-left">
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                              <Eye className="w-4 h-4" /> View
                            </button>
                            <button 
                              onClick={() => { openEditModal(txn); setOpenMenuIndex(null); }} 
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => { setDeleteConfirmId(txn._rowIndex); setOpenMenuIndex(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                            >
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

      {/* ၁၀.၄ Delete Confirmation Popup */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 text-center">
            <Trash2 className="w-8 h-8 text-rose-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Transaction?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this entry?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700">{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ၁၀.၅ Modal Form (Add/Edit Entry) အပိုင်းအစ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl my-8">
            
            {/* ၁၀.၅.၁ ခေါင်းစဉ်နှင့် Tab အပိုင်း */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-800">{editingRow ? "Edit Transaction" : "New Transaction"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="flex gap-4 p-1 bg-slate-100 rounded-lg w-fit">
                {(['Expense', 'Income', 'Transfer'] as const).map(type => (
                  <button
                    key={type} type="button" onClick={() => setTxnType(type)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${txnType === type ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* ၁၀.၅.၂ အချက်အလက်ဖြည့်ရန် (Date, Voucher, Reference, Project) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <input type="date" name="Date" value={formData.Date} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Voucher No</label>
                  <input type="text" name="Voucher_No" value={formData.Voucher_No} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Reference No</label>
                  <input type="text" name="Reference_No" value={formData.Reference_No} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Project Code</label>
                  <input type="text" name="Project_Code" value={formData.Project_Code} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              {/* ၁၀.၅.၃ စာရင်းသွင်းရန် (Book နှင့် Account Code) */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
                {txnType === 'Transfer' ? (
                  <>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-slate-500 mb-1">From Book (Credit Out)</label>
                        <select name="From_Book" value={formData.From_Book} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                          <option value="">Select Book...</option>
                          {bookAccounts.map((acc: any, i: number) => <option key={i} value={acc.Book}>{acc.Book}</option>)}
                        </select>
                      </div>
                      <div className="flex-1 w-full md:w-auto">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Amount ({formData.From_Book ? String(formData.From_Book).slice(-3) : ''})</label>
                        <input type="number" name="Amount" value={formData.Amount} onChange={handleInputChange} required placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-slate-500 mb-1">To Book (Debit In)</label>
                        <select name="To_Book" value={formData.To_Book} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                          <option value="">Select Book...</option>
                          {bookAccounts.map((acc: any, i: number) => <option key={i} value={acc.Book}>{acc.Book}</option>)}
                        </select>
                      </div>
                      <div className="flex-1 w-full md:w-auto">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Amount ({formData.To_Book ? String(formData.To_Book).slice(-3) : ''})</label>
                        <input type="number" name="To_Amount" value={formData.To_Amount} onChange={handleInputChange} required placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Book Name</label>
                      <select name="Book_Name" value={formData.Book_Name} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                        <option value="">Select Book...</option>
                        {bookAccounts.map((acc: any, i: number) => <option key={i} value={acc.Book}>{acc.Book}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Account Code</label>
                      <select name="Account_Code" value={formData.Account_Code} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                        <option value="">Select Code...</option>
                        {generalAccounts.map((acc: any, i: number) => <option key={i} value={acc.Account_Code}>{acc.Account_Code} - {acc.Account_Name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* ၁၀.၅.၄ Receiver နှင့် Description အပိုင်း */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Receiver / Payer Name</label>
                  <input type="text" name="Receiver" value={formData.Receiver} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                  <input type="text" name="Description" value={formData.Description} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              {/* ၁၀.၅.၅ ငွေကြေးတွက်ချက်မှု နှင့် ခလုတ်များ */}
              <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-4">
                {txnType !== 'Transfer' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Amount ({formData.Txn_Currency})</label>
                    <input type="number" name="Amount" value={formData.Amount} onChange={handleInputChange} required placeholder="0.00" className="w-full px-3 py-2 border-2 border-brand-200 rounded-lg text-sm outline-none focus:border-brand-500 bg-white" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Exchange Rate (To MMK)</label>
                    <input 
                      type="number" name="Exchange_Rate" value={formData.Exchange_Rate} onChange={handleInputChange} 
                      disabled={formData.Txn_Currency === 'MMK'} // 🟢 Logic မှန်ကန်အောင် ပြင်ထားသည် 🟢
                      className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100 disabled:text-slate-500 bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Base Amount (MMK)</label>
                    <input 
                      type="number" name="Base_Amount_MMK" value={formData.Base_Amount_MMK} onChange={handleInputChange} required
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:border-brand-500 outline-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700">
                  {isSubmitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
