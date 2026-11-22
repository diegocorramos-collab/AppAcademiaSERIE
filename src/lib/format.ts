export function num(v: number | null | undefined, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function kcal(v: number | null | undefined): string {
  return String(Math.round(num(v)));
}

export function kg(v: number | null | undefined, digits = 1): string {
  return num(v).toFixed(digits).replace('.', ',');
}

export function pct(v: number, total: number): number {
  if (!total) return 0;
  return Math.max(0, Math.min(1, v / total));
}

export function parseNumber(text: string): number | null {
  const cleaned = text.replace(/[^0-9,.-]/g, '').replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
