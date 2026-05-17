export function parseInput(str) {
  return parseFloat(String(str).replace(/,/g, ''));
}

export function formatNumber(num, decimals) {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatInputValue(value) {
  let raw = value.replace(/[^0-9.]/g, '');
  const parts = raw.split('.');
  if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
  if (parts.length === 2 && parts[1].length > 2) raw = parts[0] + '.' + parts[1].slice(0, 2);
  const [intPart, decPart] = raw.split('.');
  const withCommas = intPart ? parseInt(intPart, 10).toLocaleString('en-US') : '';
  if (!intPart && !decPart) return '';
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}
