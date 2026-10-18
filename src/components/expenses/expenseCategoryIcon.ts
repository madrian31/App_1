/** Icon for an expense category — known utilities get their own, anything custom gets a receipt. */
const ICONS: Record<string, string> = {
  electricity: "fa-solid fa-bolt",
  internet: "fa-solid fa-wifi",
  water: "fa-solid fa-droplet",
  supplies: "fa-solid fa-box",
  "repairs & maintenance": "fa-solid fa-screwdriver-wrench",
  rent: "fa-solid fa-house",
  transportation: "fa-solid fa-car",
  food: "fa-solid fa-utensils",
};

export function expenseCategoryIcon(category: string): string {
  return ICONS[category.trim().toLowerCase()] ?? "fa-solid fa-receipt";
}
