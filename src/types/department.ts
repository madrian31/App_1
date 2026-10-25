/** A church department that receives cash for its activities (Youth, Men's, Women's…).
 *  Stored in the `departments` collection; managed in Settings → Departments.
 *  Never deleted — turned inactive instead, so old cash records and visits keep their department.
 *  Its budget for a year is the total of its calendar activities' budgets (see departmentActivities.ts). */
export interface Department {
  id: string;
  name: string;
  leader: string; // "" when not set
  isActive: boolean;

  // ── System / meta fields ──
  modifiedBy: string;
  dateAdded: string; // ISO, set once on create
  dateModified: string; // ISO, updated on every edit
}

export type DepartmentPatch = Partial<Pick<Department, "name" | "leader" | "isActive">>;
