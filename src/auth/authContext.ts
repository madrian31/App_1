import { createContext, useContext } from "react";
import { isStaff, type AppUser } from "../types/auth";

export interface AuthState {
  /** "loading" until Firebase says whether someone is signed in. */
  status: "loading" | "signedOut" | "signedIn";
  user: AppUser | null;
  /** Why the last sign-in was ended by the app (e.g. account turned off) —
   *  shown once on the login page. */
  notice: string | null;
  clearNotice: () => void;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Name saved as "Added by" / "Modified by" on records. */
export function useCurrentUserName(): string {
  const { user } = useAuth();
  return user?.displayName || user?.username || "Unknown";
}

/** Whether the signed-in account may change data. Super Admins and Admins can; Users only
 *  view the pages they're allowed (Home, Calendar, Program Line-up, Praise & Worship).
 *  firestore.rules enforces the same, so hiding a button is never the only guard. */
export function useCanEdit(): boolean {
  const { user } = useAuth();
  return isStaff(user?.role);
}
