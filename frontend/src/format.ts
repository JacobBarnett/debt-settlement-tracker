const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatCurrency = (value: number) => currency.format(value);

export const formatCurrencyPrecise = (value: number) =>
  currencyPrecise.format(value);

/** Formats an ISO `YYYY-MM-DD` date without tripping over time zones. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonths(months: number): string {
  if (months === 0) return "Paid off";
  if (months < 12) return `${months} mo`;

  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return remainder === 0 ? `${years} yr` : `${years} yr ${remainder} mo`;
}
