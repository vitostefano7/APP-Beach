// Funzioni di generazione calendario e slot

export function generateHalfHourSlots(open: string, close: string) {
  const slots = [];
  let [h, m] = open.split(":").map(Number);
  let [hEnd, mEnd] = close.split(":").map(Number);
  while (h < hEnd || (h === hEnd && m < mEnd)) {
    const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    m += 30;
    if (m >= 60) {
      h++;
      m = 0;
    }
    const end = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    slots.push({ start, end });
  }
  return slots;
}

export function generateDatesForMonths(months: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < months * 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}
