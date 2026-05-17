export const STORAGE_KEY = 'currencyDashboard';

export const state = {
  fromCurrency: 'USD',
  toCurrency: 'COP',
  rates: null,
  timestamp: null,
  isOffline: !navigator.onLine,
};

function sanitizeJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Invalid JSON in localStorage');
    return null;
  }
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      rates: state.rates,
      timestamp: state.timestamp,
      fromCurrency: state.fromCurrency,
      toCurrency: state.toCurrency
    }));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

export function loadState(fromSelect, toSelect) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = sanitizeJSON(stored);
      if (parsed) {
        if (parsed.rates && parsed.timestamp) {
          state.rates = parsed.rates;
          state.timestamp = parsed.timestamp;
        }
        if (parsed.fromCurrency) state.fromCurrency = parsed.fromCurrency;
        if (parsed.toCurrency) state.toCurrency = parsed.toCurrency;
      }
    }
  } catch (e) {
    console.warn('Could not load from localStorage:', e);
  }

  if (fromSelect && toSelect) {
    const fromExists = Array.from(fromSelect.options).some(opt => opt.value === state.fromCurrency);
    const toExists = Array.from(toSelect.options).some(opt => opt.value === state.toCurrency);

    if (!fromExists) state.fromCurrency = 'USD';
    if (!toExists) state.toCurrency = 'COP';

    fromSelect.value = state.fromCurrency;
    toSelect.value = state.toCurrency;
  }
}
