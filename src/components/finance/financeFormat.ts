export function fmtPeso(n: number): string {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** How soon something starts: "Happening now", "Today", "Tomorrow", "In 5 days", "In 3 weeks", "In 4 months". */
export function whenLabel(daysAway: number): string {
  if (daysAway < 0) return "Happening now";
  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  if (daysAway < 14) return `In ${daysAway} days`;
  if (daysAway < 60) return `In ${Math.round(daysAway / 7)} weeks`;
  return `In ${Math.round(daysAway / 30)} months`;
}
