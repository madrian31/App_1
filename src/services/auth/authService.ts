import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import type { AppUser, UsernameEntry } from "../../types/auth";

const SETUP_DOC = doc(db, "appConfig", "setup");

// Accounts without an email still need one for Firebase Auth, so they get a
// stand-in on a reserved domain (example.com never receives mail). Nobody
// types it — the login page looks it up from the username.
const NO_EMAIL_DOMAIN = "noemail.linkup.example.com";

export const USERNAME_HINT = "3–30 characters: letters, numbers, dot, dash or underscore.";
const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): string {
  const u = normalizeUsername(username);
  if (!u) return "Please enter a username.";
  if (!USERNAME_PATTERN.test(u)) return USERNAME_HINT;
  return "";
}

/** A fresh stand-in email for an account with no real one. The random part
 *  means a reset (which makes a new sign-in) never collides with the old one. */
export function standInEmail(username: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${normalizeUsername(username)}.${suffix}@${NO_EMAIL_DOMAIN}`;
}

export function hasRealEmail(authEmail: string): boolean {
  return !authEmail.endsWith(`@${NO_EMAIL_DOMAIN}`);
}

/** Error with a Firebase-style code, so authErrorMessage() treats it the same. */
function codedError(code: string): Error {
  return Object.assign(new Error(code), { code });
}

export async function lookupUsername(username: string): Promise<UsernameEntry | null> {
  const snap = await getDoc(doc(db, "usernames", normalizeUsername(username)));
  return snap.exists() ? (snap.data() as UsernameEntry) : null;
}

/** Signs in with a username or an email ("@" decides which). "Remember me"
 *  keeps the sign-in after the browser closes; otherwise it ends with the tab. */
export async function signIn(identifier: string, password: string, remember: boolean): Promise<void> {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const id = identifier.trim();
  let email = id;
  if (!id.includes("@")) {
    const entry = await lookupUsername(id);
    // Same error as a wrong password, so the login page never reveals which
    // usernames exist.
    if (!entry) throw codedError("auth/invalid-credential");
    email = entry.authEmail;
  }
  await signInWithEmailAndPassword(auth, email, password);
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as AppUser) : null;
}

export async function recordLogin(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { lastLoginAt: new Date().toISOString() });
}

/** False until the first admin account exists — the login page then offers
 *  to create it. */
export async function isSetupDone(): Promise<boolean> {
  return (await getDoc(SETUP_DOC)).exists();
}

export interface FirstAdminInput {
  displayName: string;
  username: string;
  email: string; // optional — "" for none
  password: string;
}

/** Creates the very first account, as an Admin, and signs in with it. */
export async function createFirstAdmin(input: FirstAdminInput): Promise<void> {
  if (await isSetupDone()) throw codedError("app/setup-done");
  const username = normalizeUsername(input.username);
  const email = input.email.trim();
  const authEmail = email || standInEmail(username);

  const { user } = await createUserWithEmailAndPassword(auth, authEmail, input.password);
  const now = new Date().toISOString();
  const profile: AppUser = {
    uid: user.uid,
    username,
    displayName: input.displayName.trim(),
    email,
    authEmail,
    role: "admin",
    isActive: true,
    createdAt: now,
    createdBy: input.displayName.trim(),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, "users", user.uid), profile);
  batch.set(doc(db, "usernames", username), { uid: user.uid, authEmail } satisfies UsernameEntry);
  batch.set(SETUP_DOC, { createdAt: now, firstAdminUid: user.uid });
  await batch.commit();
}

export type ResetRequestResult = "sent" | "no-email";

/** "Forgot password?" — emails a reset link when the account has a real
 *  email. Accounts without one have to ask an admin. */
export async function requestPasswordReset(identifier: string): Promise<ResetRequestResult> {
  const id = identifier.trim();
  let email = id;
  if (!id.includes("@")) {
    const entry = await lookupUsername(id);
    // Unknown username: answer as if sent, so this can't be used to find usernames.
    if (!entry) return "sent";
    if (!hasRealEmail(entry.authEmail)) return "no-email";
    email = entry.authEmail;
  }
  await sendPasswordResetEmail(auth, email);
  return "sent";
}

/** Changes the signed-in user's own password. Firebase wants the current
 *  password again first, as proof it's really them. */
export async function changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw codedError("auth/no-current-user");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  await updatePassword(user, newPassword);
}

/** Plain-language message for a sign-in or account error. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "Incorrect username, email or password.";
    case "auth/too-many-requests":
      return "Too many tries. Please wait a few minutes, then try again.";
    case "auth/network-request-failed":
      return "No internet connection. Please check your connection and try again.";
    case "auth/email-already-in-use":
      return "That email is already used by another account.";
    case "auth/invalid-email":
      return "That email doesn't look right.";
    case "auth/weak-password":
      return "That password is too short. Use at least 8 characters.";
    case "auth/requires-recent-login":
      return "Please sign out and sign in again, then try once more.";
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "Sign-in isn't turned on yet for this app. In the Firebase Console, open Authentication and turn on Email/Password.";
    case "app/setup-done":
      return "The first admin account already exists. Please sign in instead.";
    case "app/username-taken":
      return "That username is already taken. Please choose another.";
    case "permission-denied":
      return "You don't have permission to do that.";
    default:
      return "Something went wrong. Please try again.";
  }
}
