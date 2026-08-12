export interface SundaySchoolChild {
  id: string;

  // A child is identifiable by EITHER a full name (first + last) OR a nickname —
  // not all kids' full names are known/consistent, especially early on.
  firstName?: string;
  lastName?: string;
  nickname?: string;

  birthday?: string; // ISO date string — often unknown, so optional
  guardianName?: string;
  guardianContact?: string;

  /** Links to an existing Member if the guardian is already a registered member.
   *  The child itself never becomes a Member record — Sunday School kids have a
   *  very different lifecycle (high turnover, age-limited) from adult membership. */
  parentMemberId?: string;

  dateEnrolled: string; // ISO date string
  isActive: boolean; // false = stopped attending ("dropped"), not deleted
  addedBy: string;
}

export type NewSundaySchoolChild = Omit<SundaySchoolChild, "id">;

/** Full name if both first + last are filled, otherwise falls back to nickname.
 *  Used by both the roster table display and search. */
export function displayChildName(
  child: Pick<SundaySchoolChild, "firstName" | "lastName" | "nickname">
): string {
  const first = child.firstName?.trim();
  const last = child.lastName?.trim();
  if (first && last) return `${first} ${last}`;
  return child.nickname?.trim() || "(unnamed)";
}

/** True if there's enough identifying info to save the record — either a full
 *  first+last name, or at least a nickname. */
export function hasValidName(
  child: Pick<SundaySchoolChild, "firstName" | "lastName" | "nickname">
): boolean {
  const first = child.firstName?.trim();
  const last = child.lastName?.trim();
  const nick = child.nickname?.trim();
  return Boolean((first && last) || nick);
}

/** Age in years from an ISO birthday, or null if unknown/unparseable. */
export function computeAge(birthday?: string): number | null {
  if (!birthday) return null;
  const b = new Date(`${birthday}T00:00:00`);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() >= b.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}
