/**
 * Currency Dashboard — USD ↔ COP Converter
 * Vanilla JS · Offline-capable · PWA
 */

(() => {
  'use strict';

  // ===== Constants =====
  const API_URL = 'https://open.er-api.com/v6/latest/USD';
  const STORAGE_KEY = 'currencyDashboard';
  const DIRECTION_KEY = 'currencyDirection';
  const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

  // ===== DOM Elements =====
  const fromInput    = document.getElementById('from-input');
  const toOutput     = document.getElementById('to-output');
  const swapBtn      = document.getElementById('swap-btn');
  const fromRate     = document.getElementById('from-rate');
  const toRate       = document.getElementById('to-rate');
  const lastUpdated  = document.getElementById('last-updated');
  const offlineBanner = document.getElementById('offline-banner');
  const offlineText  = document.getElementById('offline-text');

  const fromFlag = document.getElementById('from-flag');
  const fromCode = document.getElementById('from-code');
  const fromName = document.getElementById('from-name');
  const toFlag   = document.getElementById('to-flag');
  const toCode   = document.getElementById('to-code');
  const toName   = document.getElementById('to-name');

  // ===== State =====
  let state = {
    fromCurrency: 'USD',
    toCurrency: 'COP',
    rates: null, // Holds all rates relative to USD
    timestamp: null,
    isOffline: !navigator.onLine,
  };

  // ===== Elements =====
  const fromSelect = document.getElementById('from-currency');
  const toSelect = document.getElementById('to-currency');

  // ===== LocalStorage =====
  function saveState() {
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

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.rates && parsed.timestamp) {
          state.rates = parsed.rates;
          state.timestamp = parsed.timestamp;
        }
        if (parsed.fromCurrency) state.fromCurrency = parsed.fromCurrency;
        if (parsed.toCurrency) state.toCurrency = parsed.toCurrency;
      }
    } catch (e) {
      console.warn('Could not load from localStorage:', e);
    }
    
    // Set UI selects to match state
    // Set UI selects to match state
    if (fromSelect && toSelect) {
      // Validate that state.fromCurrency exists in our options
      const fromExists = Array.from(fromSelect.options).some(opt => opt.value === state.fromCurrency);
      const toExists = Array.from(toSelect.options).some(opt => opt.value === state.toCurrency);
      
      if (!fromExists) state.fromCurrency = 'USD';
      if (!toExists) state.toCurrency = 'COP';

      fromSelect.value = state.fromCurrency;
      toSelect.value = state.toCurrency;
    }
  }

  // ===== API =====
  async function fetchRate() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.result === 'success' && data.rates) {
        state.rates = data.rates;
        state.timestamp = new Date().toISOString();
        saveState();
        updateUI();
        hideOfflineBanner();
        return true;
      }
      throw new Error('Invalid API response');
    } catch (err) {
      console.warn('Rate fetch failed:', err);
      showOfflineBanner();
      return false;
    }
  }

  // ===== Number Helpers =====
  function parseInput(str) {
    return parseFloat(String(str).replace(/,/g, ''));
  }

  function formatNumber(num, decimals) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function formatInputValue(value) {
    let raw = value.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) raw = parts[0] + '.' + parts[1].slice(0, 2);
    const [intPart, decPart] = raw.split('.');
    const withCommas = intPart ? parseInt(intPart, 10).toLocaleString('en-US') : '';
    if (!intPart && !decPart) return '';
    return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
  }

  // ===== Conversion =====
  function getRate(from, to) {
    if (!state.rates || !state.rates[from] || !state.rates[to]) return null;
    // Base is USD. target / base
    const usdToFrom = state.rates[from];
    const usdToTo = state.rates[to];
    // from -> USD -> to
    return (1 / usdToFrom) * usdToTo;
  }

  function convert() {
    const input = parseInput(fromInput.value);
    const rate = getRate(state.fromCurrency, state.toCurrency);
    
    if (isNaN(input) || input < 0 || !rate) {
      toOutput.textContent = '0.00';
      return;
    }

    const result = input * rate;

    toOutput.textContent = formatNumber(result, 2);
    toOutput.classList.remove('result-flash');
    void toOutput.offsetWidth;
    toOutput.classList.add('result-flash');
  }

  // ===== Swap =====
  function swap() {
    const temp = state.fromCurrency;
    state.fromCurrency = state.toCurrency;
    state.toCurrency = temp;
    
    // Update the DOM selects
    fromSelect.value = state.fromCurrency;
    toSelect.value = state.toCurrency;
    
    // UI rotation effect
    swapBtn.classList.add('swapped');
    setTimeout(() => swapBtn.classList.remove('swapped'), 350);

    saveState();
    updateRateDisplay();

    const currentOutput = toOutput.textContent.replace(/,/g, '');
    const parsed = parseFloat(currentOutput);
    if (!isNaN(parsed) && parsed > 0) {
      fromInput.value = formatInputValue(parsed.toFixed(2));
    }
    convert();
  }

  // ===== UI Updates =====
  function updateRateDisplay() {
    const rate = getRate(state.fromCurrency, state.toCurrency);
    const inverseRate = getRate(state.toCurrency, state.fromCurrency);

    if (!rate || !inverseRate) {
      fromRate.textContent = 'Loading rate…';
      toRate.textContent = 'Loading rate…';
      return;
    }

    // Determine decimal places for rate display
    const rateFormat = rate < 0.01 ? 6 : 4;
    const inverseFormat = inverseRate < 0.01 ? 6 : 4;

    fromRate.textContent = `1 ${state.fromCurrency} = ${formatNumber(rate, rateFormat)} ${state.toCurrency}`;
    toRate.textContent = `1 ${state.toCurrency} = ${formatNumber(inverseRate, inverseFormat)} ${state.fromCurrency}`;
  }

  function updateTimestamp() {
    if (!state.timestamp) {
      lastUpdated.textContent = 'Fetching latest rate…';
      return;
    }
    const date = new Date(state.timestamp);
    const formatted = date.toLocaleString('en-US', {
      timeZone: 'America/Bogota',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    lastUpdated.textContent = `Last updated: ${formatted}`;
  }

  function updateUI() {
    updateRateDisplay();
    updateTimestamp();
    convert();
  }

  // ===== Offline Handling =====
  function formatTimestampForBanner() {
    if (!state.timestamp) return 'unknown';
    const date = new Date(state.timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  function showOfflineBanner() {
    state.isOffline = true;
    const ts = formatTimestampForBanner();
    offlineText.textContent = `Offline Mode - Using last known rate from ${ts}`;
    offlineBanner.hidden = false;
  }

  function hideOfflineBanner() {
    state.isOffline = false;
    offlineBanner.hidden = true;
  }

  // ===== Event Listeners =====
  fromInput.addEventListener('input', () => {
    const cursorPos = fromInput.selectionStart;
    const oldLen = fromInput.value.length;
    fromInput.value = formatInputValue(fromInput.value);
    const newLen = fromInput.value.length;
    // Adjust cursor position after formatting
    const newPos = Math.max(0, cursorPos + (newLen - oldLen));
    fromInput.setSelectionRange(newPos, newPos);
    convert();
  });
  
  if (fromSelect && toSelect) {
    fromSelect.addEventListener('change', (e) => {
      state.fromCurrency = e.target.value;
      saveState();
      updateRateDisplay();
      convert();
    });
    
    toSelect.addEventListener('change', (e) => {
      state.toCurrency = e.target.value;
      saveState();
      updateRateDisplay();
      convert();
    });
  }

  swapBtn.addEventListener('click', swap);

  window.addEventListener('online', () => {
    hideOfflineBanner();
    fetchRate();
  });

  window.addEventListener('offline', () => {
    showOfflineBanner();
  });

  // Listen for rate updates from the Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'RATE_UPDATE') {
        state.rates = event.data.rates;
        state.timestamp = event.data.timestamp;
        saveState();
        updateUI();
        hideOfflineBanner();
      }
    });
  }

  // ===== Service Worker Registration =====
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registered:', reg.scope);
      } catch (err) {
        console.warn('Service Worker registration failed:', err);
      }
    });
  }

  // ===== Init =====
  function init() {
    loadState();
    updateUI();

    if (navigator.onLine) {
      fetchRate();
    } else {
      showOfflineBanner();
    }

    // Periodic refresh
    setInterval(() => {
      if (navigator.onLine) {
        fetchRate();
      }
    }, UPDATE_INTERVAL);
  }

  init();
})();
