import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  sendPasswordResetEmail,
  type Auth,
} from "firebase/auth";
import { collection, doc, getDocs, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { firebaseConfig } from "../../firebase/config";
import type { AppUser, UserRole, UsernameEntry } from "../../types/auth";
import { hasRealEmail, lookupUsername, normalizeUsername, standInEmail } from "./authService";

/**
 * Creating an account signs the creating app in as the new user. Doing that
 * on the main app would sign the admin out, so new accounts are made on a
 * throwaway second app that keeps nothing (in-memory sign-in) and is deleted
 * right after.
 */
async function createSignIn(authEmail: string, password: string): Promise<string> {
  const app = initializeApp(firebaseConfig, `account-creator-${Date.now()}`);
  try {
    const creatorAuth: Auth = initializeAuth(app, { persistence: inMemoryPersistence });
    const { user } = await createUserWithEmailAndPassword(creatorAuth, authEmail, password);
    return user.uid;
  } finally {
    await deleteApp(app);
  }
}

/** A temporary password that's easy to read out or type: no 0/O or 1/l/I. */
export function generateTempPassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

/** Every account, by name. Records left behind by a password reset are hidden. */
export async function listUserAccounts(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map((d) => d.data() as AppUser)
    .filter((u) => !u.replacedBy)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export interface NewAccountInput {
  displayName: string;
  username: string;
  email: string; // optional — "" for none
  password: string;
  role: UserRole;
  memberId?: string;
}

export async function createUserAccount(input: NewAccountInput, createdBy: string): Promise<AppUser> {
  const username = normalizeUsername(input.username);
  if (await lookupUsername(username)) {
    throw Object.assign(new Error("app/username-taken"), { code: "app/username-taken" });
  }
  const email = input.email.trim();
  const authEmail = email || standInEmail(username);
  const uid = await createSignIn(authEmail, input.password);

  const account: AppUser = {
    uid,
    username,
    displayName: input.displayName.trim(),
    email,
    authEmail,
    role: input.role,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy,
    ...(input.memberId ? { memberId: input.memberId } : {}),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), account);
  batch.set(doc(db, "usernames", username), { uid, authEmail } satisfies UsernameEntry);
  await batch.commit();
  return account;
}

export interface AccountChanges {
  displayName: string;
  role: UserRole;
  memberId: string; // "" to unlink
}

/** Name, role and member link. Username and email stay as they were made —
 *  they're tied to the sign-in itself. */
export async function updateUserAccount(uid: string, changes: AccountChanges): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    displayName: changes.displayName.trim(),
    role: changes.role,
    memberId: changes.memberId,
  });
}

/** Turning an account off blocks sign-in (checked by the app and by the
 *  Firestore rules) without deleting anything. */
export async function setUserActive(uid: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), { isActive });
}

export type ResetResult = { kind: "email-sent"; email: string } | { kind: "replaced"; account: AppUser };

/**
 * Resets someone's password without Cloud Functions:
 * - Account with an email: Firebase emails them a link to choose a new one.
 * - Account without: the app can't change another person's password, so it
 *   makes a fresh sign-in with `newPassword` under the same username, moves
 *   the account details to it, and turns the old sign-in off.
 */
export async function resetUserPassword(account: AppUser, newPassword: string): Promise<ResetResult> {
  if (hasRealEmail(account.authEmail)) {
    await sendPasswordResetEmail(auth, account.authEmail);
    return { kind: "email-sent", email: account.authEmail };
  }

  const authEmail = standInEmail(account.username);
  const uid = await createSignIn(authEmail, newPassword);
  const moved: AppUser = { ...account, uid, authEmail };
  delete moved.lastLoginAt;

  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), moved);
  batch.set(doc(db, "usernames", account.username), { uid, authEmail } satisfies UsernameEntry);
  batch.update(doc(db, "users", account.uid), { isActive: false, replacedBy: uid });
  await batch.commit();
  return { kind: "replaced", account: moved };
}
