import Decimal from 'decimal.js';
import { ExtraPaymentEntry, LumpSumEntry } from './types/loan.types';

// Extra payments are stepped-recurring: the latest entry on or before `date`
// sets the amount. An entry of 0 resolves to 0 rather than falling through to
// an earlier entry — that is how "I stopped paying extra" is expressed.
export function resolveExtraPayment(
  extraPayments: ExtraPaymentEntry[] | null | undefined,
  date: Date,
): Decimal {
  const active = [...(extraPayments ?? [])]
    .filter((ep) => new Date(ep.start_date) <= date)
    .sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    );

  return active.length > 0 ? new Decimal(active[0].amount) : new Decimal(0);
}

// Lump sums land in the month their date falls in.
export function resolveLumpSumsForMonth(
  lumpSums: LumpSumEntry[] | null | undefined,
  date: Date,
): Decimal {
  return (lumpSums ?? []).reduce((sum, ls) => {
    const d = new Date(ls.date);
    return d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth()
      ? sum.plus(ls.amount)
      : sum;
  }, new Decimal(0));
}

export function getNewPaymentDate(startDate: Date, targetDay: number) {
  const start = new Date(startDate);

  if (targetDay < 1 || targetDay > 31) {
    throw new Error('targetDay must be between 1 and 31');
  }

  const year = start.getFullYear();
  const month = start.getMonth();

  let result = new Date(year, month, targetDay);

  if (result.getMonth() !== month) {
    result = new Date(year, month + 1, 0);
  }

  return result;
}
