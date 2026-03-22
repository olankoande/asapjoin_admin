export function formatMoney(amount: number | string | null | undefined, currency = 'CAD'): string {
  const num = Number(amount);
  if (!amount && amount !== 0) return '—';
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(num);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export function formatDateOnly(date: string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(d);
}

export function truncate(str: string, len = 50): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}
