/**
 * Currency Dashboard — USD ↔ COP Converter
 * Vanilla JS · Offline-capable · PWA
 */

(() => {
  'use strict';

  // ===== Constants =====
  const API_URL = 'https://open.er-api.com/v6/latest/USD';
  const STORAGE_KEY = 'currencyDashboard';
  const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

  // ===== DOM Elements =====
  const fromInput    = document.getElementById('from-input');
  const toOutput     = document.getElementById('to-output');
  const swapBtn      = document.getElementById('swap-btn');
  const rateDisplay  = document.getElementById('rate-display');
  const rateBadge    = document.getElementById('rate-badge');
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
    direction: 'USD_TO_COP', // or 'COP_TO_USD'
    rate: null,               // COP per 1 USD
    timestamp: null,
    isOffline: !navigator.onLine,
  };

  // ===== LocalStorage =====
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        rate: state.rate,
        timestamp: state.timestamp,
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
        if (parsed.rate && parsed.timestamp) {
          state.rate = parsed.rate;
          state.timestamp = parsed.timestamp;
        }
      }
    } catch (e) {
      console.warn('Could not load from localStorage:', e);
    }
  }

  // ===== API =====
  async function fetchRate() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.result === 'success' && data.rates && data.rates.COP) {
        state.rate = data.rates.COP;
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

  // ===== Conversion =====
  function convert() {
    const input = parseFloat(fromInput.value);
    if (isNaN(input) || input < 0 || !state.rate) {
      toOutput.textContent = '0.00';
      return;
    }

    let result;
    if (state.direction === 'USD_TO_COP') {
      result = input * state.rate;
    } else {
      result = input / state.rate;
    }

    // Format output
    const formatted = state.direction === 'USD_TO_COP'
      ? formatNumber(result, 0)    // COP has no decimals typically
      : formatNumber(result, 2);   // USD uses 2 decimals

    toOutput.textContent = formatted;
    toOutput.classList.remove('result-flash');
    // Trigger reflow to restart animation
    void toOutput.offsetWidth;
    toOutput.classList.add('result-flash');
  }

  function formatNumber(num, decimals) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  // ===== Swap =====
  function swap() {
    state.direction = state.direction === 'USD_TO_COP' ? 'COP_TO_USD' : 'USD_TO_COP';
    swapBtn.classList.toggle('swapped');
    updateLabels();
    updateRateDisplay();

    // Swap the values too for convenience
    const currentOutput = toOutput.textContent.replace(/,/g, '');
    const parsed = parseFloat(currentOutput);
    if (!isNaN(parsed) && parsed > 0) {
      fromInput.value = parsed;
    }
    convert();
  }

  // ===== UI Updates =====
  function updateLabels() {
    if (state.direction === 'USD_TO_COP') {
      fromFlag.textContent = '🇺🇸';
      fromCode.textContent = 'USD';
      fromName.textContent = 'US Dollar';
      toFlag.textContent   = '🇨🇴';
      toCode.textContent   = 'COP';
      toName.textContent   = 'Colombian Peso';
    } else {
      fromFlag.textContent = '🇨🇴';
      fromCode.textContent = 'COP';
      fromName.textContent = 'Colombian Peso';
      toFlag.textContent   = '🇺🇸';
      toCode.textContent   = 'USD';
      toName.textContent   = 'US Dollar';
    }
  }

  function updateRateDisplay() {
    if (!state.rate) {
      rateDisplay.textContent = 'Loading rate…';
      return;
    }

    if (state.direction === 'USD_TO_COP') {
      rateDisplay.textContent = `1 USD = ${formatNumber(state.rate, 2)} COP`;
    } else {
      const inverse = 1 / state.rate;
      rateDisplay.textContent = `1 COP = ${formatNumber(inverse, 6)} USD`;
    }
  }

  function updateTimestamp() {
    if (!state.timestamp) {
      lastUpdated.textContent = 'Fetching latest rate…';
      return;
    }
    const date = new Date(state.timestamp);
    const formatted = date.toLocaleString('en-US', {
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
    updateLabels();
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
  fromInput.addEventListener('input', convert);
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
        state.rate = event.data.rate;
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
