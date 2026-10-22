export type FormStatus = "idle" | "loading" | "success" | "error";

export type UserRole = "admin" | "user";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  user: "User",
};

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
