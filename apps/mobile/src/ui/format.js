export function formatAmount(currency, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);

  const decimals = currency === 'PLN' ? 2 : 6;
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(n);
}
