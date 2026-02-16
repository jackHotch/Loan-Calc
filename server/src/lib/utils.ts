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
