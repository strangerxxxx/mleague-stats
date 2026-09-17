export function formatPoints(value: number, digits = 1): string {
  const rounded = roundTo(value, digits);
  const amount = formatNumber(Math.abs(rounded), digits);
  if (rounded > 0) return `+${amount}pt`;
  if (rounded < 0) return `▲${amount}pt`;
  return `${formatNumber(0, digits)}pt`;
}

export function formatSigned(value: number, digits = 1): string {
  const rounded = roundTo(value, digits);
  if (rounded > 0) return `+${formatNumber(rounded, digits)}`;
  if (rounded < 0) return `▲${formatNumber(Math.abs(rounded), digits)}`;
  return "0";
}

export function formatRating(value: number, digits = 1): string {
  return `R${roundTo(value, digits).toFixed(digits)}`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatAvgRank(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "-";
  return value.toFixed(2);
}

export function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString("ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function roundTo(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${year}/${Number(month)}/${Number(day)}`;
}

export function pointsClass(value: number): string {
  if (value > 0) return "num-pos";
  if (value < 0) return "num-neg";
  return "num-zero";
}
