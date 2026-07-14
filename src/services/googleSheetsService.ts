// src/services/googleSheetsService.ts

// 🌟 ၁။ URL အသစ်နှင့် အဟောင်းများကို စနစ်တကျ ကြေညာခြင်း
const AUTH_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwoMlr_08HP2Q3Qz1GPPK4j_z3ZMy_DcgtQkfZIBipRyZqOD6NyliT4NtSQoZ6F6XIrcg/exec'; // Login
const DATA_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzIhbs0Wnhc-I1bjPicNUu5sxlhV86fC9gzNwDr2cl5gbntk1Zvf6JH36JoKogjLODy/exec'; // Accounting Data
const INVENTORY_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxPH6BkUvw6mNTpeKOrIa9sTqajD5V0lBPrfKXlp5QxciCI_NGvtTac0yq-joaZzTvR/exec'; // Inventory Data

// src/services/googleSheetsService.ts ထဲမှ getTargetUrl function ကို ရှာပြီး အောက်ပါအတိုင်း ပြင်ပါ

const getTargetUrl = (sheetName: string) => {
  // Authentication အတွက်
  if (sheetName === '0_Users') return AUTH_WEB_APP_URL;

  // Inventory နှင့် သက်ဆိုင်သော Sheet များစာရင်း (ဒီထဲမှာ 1_Product_Master ကို ထပ်ထည့်လိုက်ပါပြီ) 🌟
  const inventorySheets = [
    '1_Product_Master',      // <--- ဒီနေရာမှာ အသစ်ထပ်ထည့်လိုက်ပါ
    '3_Goods_Receipt_IN', 
    '4_Goods_Issue_OUT', 
    '5_Inventory_Movements', 
    '6_Inventory_Balance',
    '9_Projects' // အကယ်၍ 10_Projects သို့ ပြောင်းထားပါက '10_Projects' ဟု ပြင်ပါ
  ];

  if (inventorySheets.includes(sheetName)) {
    return INVENTORY_WEB_APP_URL;
  }

  // ကျန်ရှိသော Accounting Data များအတွက်
  return DATA_WEB_APP_URL;
};

export const googleSheetsService = {
  readData: async (sheetName: string) => {
    const baseUrl = getTargetUrl(sheetName);
    try {
      const response = await fetch(`${baseUrl}?action=read&sheet=${sheetName}`);
      const result = await response.json();
      if (result.status === 'success') {
        return result.data;
      }
      throw new Error(result.message || 'Error reading data');
    } catch (error) {
      console.error(`Error reading ${sheetName}:`, error);
      throw error;
    }
  },

  writeData: async (sheetName: string, data: any) => {
    const baseUrl = getTargetUrl(sheetName);
    try {
      const response = await fetch(`${baseUrl}?action=write&sheet=${sheetName}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        return result;
      }
      throw new Error(result.message || 'Error writing data');
    } catch (error) {
      console.error(`Error writing to ${sheetName}:`, error);
      throw error;
    }
  },

  updateData: async (sheetName: string, data: any) => {
    const baseUrl = getTargetUrl(sheetName);
    try {
      const response = await fetch(`${baseUrl}?action=update&sheet=${sheetName}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        return result;
      }
      throw new Error(result.message || 'Error updating data');
    } catch (error) {
      console.error(`Error updating ${sheetName}:`, error);
      throw error;
    }
  },

  deleteData: async (sheetName: string, rowIndex: number) => {
    const baseUrl = getTargetUrl(sheetName);
    try {
      const response = await fetch(`${baseUrl}?action=delete&sheet=${sheetName}`, {
        method: 'POST',
        body: JSON.stringify({ _rowIndex: rowIndex }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success') {
        return result;
      }
      throw new Error(result.message || 'Error deleting data');
    } catch (error) {
      console.error(`Error deleting from ${sheetName}:`, error);
      throw error;
    }
  }
};