const eurFormatter = new Intl.NumberFormat('bg-BG', {
  style: 'currency',
  currency: 'EUR',
});

export function formatCurrency(amount: number): string {
  return eurFormatter.format(amount);
}
