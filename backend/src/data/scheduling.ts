export interface AppointmentWindow {
  id: string;
  windowStart: string;
  windowEnd: string;
}

/** Deterministic set of upcoming weekday appointment windows, relative to now. */
export function getAvailableWindows(count = 4): AppointmentWindow[] {
  const windows: AppointmentWindow[] = [];
  const cursor = new Date();
  cursor.setHours(9, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (windows.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      const start = new Date(cursor);
      const end = new Date(cursor);
      end.setHours(end.getHours() + 2);
      windows.push({
        id: `win-${windows.length + 1}`,
        windowStart: start.toISOString(),
        windowEnd: end.toISOString(),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return windows;
}

export function findWindowById(id: string): AppointmentWindow | undefined {
  return getAvailableWindows(10).find((w) => w.id === id);
}
