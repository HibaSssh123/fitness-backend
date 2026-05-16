export function parseDateRange(date: string) {
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  const isValidDate = !Number.isNaN(parsedDate.getTime());

  const startDate = isValidDate ? parsedDate : new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}
