// Returns today's date in the device's local timezone as YYYY-MM-DD.
// Using local date ensures staff + admin in the same office always agree on
// what "today" means, independent of UTC boundaries.
export function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
