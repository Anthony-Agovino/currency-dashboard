import '../css/style.css';
import { state, saveState, loadState } from './state.js';
import { fetchRate } from './api.js';
import { formatInputValue, formatNumber } from './utils.js';
import { getRate, convert } from './currency.js';

const UPDATE_INTERVAL = 60 * 60 * 1000;

document.addEventListener('DOMContentLoaded', () => {
  const fromInput = document.getElementById('from-input');
  const toOutput = document.getElementById('to-output');
  const swapBtn = document.getElementById('swap-btn');
  const fromRate = document.getElementById('from-rate');
  const toRate = document.getElementById('to-rate');
  const lastUpdated = document.getElementById('last-updated');
  const offlineBanner = document.getElementById('offline-banner');
  const offlineText = document.getElementById('offline-text');
  const fromSelect = document.getElementById('from-currency');
  const toSelect = document.getElementById('to-currency');

  function updateRateDisplay() {
    const rate = getRate(state.fromCurrency, state.toCurrency);
    const inverseRate = getRate(state.toCurrency, state.fromCurrency);

    if (!rate || !inverseRate) {
      if(fromRate) fromRate.textContent = 'Loading rate…';
      if(toRate) toRate.textContent = 'Loading rate…';
      return;
    }

    const rateFormat = rate < 0.01 ? 6 : 4;
    const inverseFormat = inverseRate < 0.01 ? 6 : 4;

    if(fromRate) fromRate.textContent = `1 ${state.fromCurrency} = ${formatNumber(rate, rateFormat)} ${state.toCurrency}`;
    if(toRate) toRate.textContent = `1 ${state.toCurrency} = ${formatNumber(inverseRate, inverseFormat)} ${state.fromCurrency}`;
  }

  function updateTimestamp() {
    if(!lastUpdated) return;
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
    updateRateDisplay();
    updateTimestamp();
    convert(fromInput, toOutput);
  }

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
    if(offlineText) offlineText.textContent = `Offline Mode - Using last known rate from ${ts}`;
    if(offlineBanner) offlineBanner.hidden = false;
  }

  function hideOfflineBanner() {
    state.isOffline = false;
    if(offlineBanner) offlineBanner.hidden = true;
  }

  function swap() {
    const temp = state.fromCurrency;
    state.fromCurrency = state.toCurrency;
    state.toCurrency = temp;

    if(fromSelect) fromSelect.value = state.fromCurrency;
    if(toSelect) toSelect.value = state.toCurrency;

    if(swapBtn) {
        swapBtn.classList.add('swapped');
        setTimeout(() => swapBtn.classList.remove('swapped'), 350);
    }

    saveState();
    updateRateDisplay();

    if(toOutput && fromInput) {
        const currentOutput = toOutput.textContent.replace(/,/g, '');
        const parsed = parseFloat(currentOutput);
        if (!isNaN(parsed) && parsed > 0) {
        fromInput.value = formatInputValue(parsed.toFixed(2));
        }
        convert(fromInput, toOutput);
    }
  }

  if(fromInput) {
      fromInput.addEventListener('input', () => {
        const cursorPos = fromInput.selectionStart;
        const oldLen = fromInput.value.length;
        fromInput.value = formatInputValue(fromInput.value);
        const newLen = fromInput.value.length;
        const newPos = Math.max(0, cursorPos + (newLen - oldLen));
        fromInput.setSelectionRange(newPos, newPos);
        convert(fromInput, toOutput);
      });
  }

  if (fromSelect && toSelect) {
    fromSelect.addEventListener('change', (e) => {
      state.fromCurrency = e.target.value;
      saveState();
      updateRateDisplay();
      convert(fromInput, toOutput);
    });

    toSelect.addEventListener('change', (e) => {
      state.toCurrency = e.target.value;
      saveState();
      updateRateDisplay();
      convert(fromInput, toOutput);
    });
  }

  if(swapBtn) swapBtn.addEventListener('click', swap);

  window.addEventListener('online', () => {
    hideOfflineBanner();
    fetchRate(updateUI, showOfflineBanner, hideOfflineBanner);
  });

  window.addEventListener('offline', () => {
    showOfflineBanner();
  });

  function init() {
    loadState(fromSelect, toSelect);
    updateUI();

    if (navigator.onLine) {
      fetchRate(updateUI, showOfflineBanner, hideOfflineBanner);
    } else {
      showOfflineBanner();
    }

    setInterval(() => {
      if (navigator.onLine) {
        fetchRate(updateUI, showOfflineBanner, hideOfflineBanner);
      }
    }, UPDATE_INTERVAL);
  }

  init();
});
