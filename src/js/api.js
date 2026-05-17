import { state, saveState } from './state.js';

export async function fetchRate(updateUI, showOfflineBanner, hideOfflineBanner) {
  const API_URL = import.meta.env.VITE_API_URL || 'https://open.er-api.com/v6/latest/USD';
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.result === 'success' && data.rates) {
      state.rates = data.rates;
      state.timestamp = new Date().toISOString();
      saveState();
      if(updateUI) updateUI();
      if(hideOfflineBanner) hideOfflineBanner();
      return true;
    }
    throw new Error('Invalid API response');
  } catch (err) {
    console.warn('Rate fetch failed:', err);
    if(showOfflineBanner) showOfflineBanner();
    return false;
  }
}
