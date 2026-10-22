export type FormStatus = "idle" | "loading" | "success" | "error";

/**
 * - superadmin: everything, including Admin and Super Admin accounts.
 * - admin: every page and setting; manages User accounts only.
 * - user: Home, Calendar, Program Line-up and Praise & Worship only.
 * The Firestore rules (firestore.rules) enforce the same split.
 */
export type UserRole = "superadmin" | "admin" | "user";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  user: "User",
};

/** Roles that see the whole app (everything a User can't). */
export const STAFF_ROLES: UserRole[] = ["superadmin", "admin"];

export function isStaff(role: UserRole | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

/** Whether `actor` may edit, reset or turn off `target`'s account. Super
 *  Admins manage everyone; Admins manage Users only. */
export function canManageAccount(actor: UserRole | undefined, target: UserRole): boolean {
  if (actor === "superadmin") return true;
  return actor === "admin" && target === "user";
}

/** Roles `actor` may give to an account they make or edit. */
export function assignableRoles(actor: UserRole | undefined): UserRole[] {
  if (actor === "superadmin") return ["user", "admin", "superadmin"];
  return actor === "admin" ? ["user"] : [];
}

/** users/{uid} — one per sign-in account. */
export interface AppUser {
  uid: string;
  username: string; // lowercase and unique — also the id of usernames/{username}
  displayName: string; // shown in the sidebar and saved as "Added by" on records
  email: string; // real email, used for "Forgot password"; "" when the account has none
  authEmail: string; // what Firebase Auth signs in with: the real email, or a stand-in
  role: UserRole;
  memberId?: string; // the member record this account belongs to, if linked
  isActive: boolean; // false = turned off by an admin; can't sign in
  createdAt: string; // ISO
  createdBy: string;
  lastLoginAt?: string; // ISO — last time the app was opened while signed in
  // Set when an admin reset the password of an account with no email: the
  // account moved to a new sign-in and this record is kept only for history.
  replacedBy?: string;
}

/** usernames/{username} — lets the login page find the sign-in email for a
 *  username before anyone is signed in. */
export interface UsernameEntry {
  uid: string;
  authEmail: string;
}
