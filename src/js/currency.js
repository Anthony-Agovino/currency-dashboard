import { state } from './state.js';
import { parseInput, formatNumber } from './utils.js';

export function getRate(from, to) {
  if (!state.rates || !state.rates[from] || !state.rates[to]) return null;
  const usdToFrom = state.rates[from];
  const usdToTo = state.rates[to];
  return (1 / usdToFrom) * usdToTo;
}

export function convert(fromInput, toOutput) {
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
