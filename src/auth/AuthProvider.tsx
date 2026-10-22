import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { getUserProfile, recordLogin, signOutUser } from "../services/auth/authService";
import type { AppUser } from "../types/auth";
import { AuthContext, type AuthState } from "./authContext";

// Creating the first admin signs in a moment before its account record is
// written, so a missing record is re-checked a few times before giving up.
const PROFILE_RETRIES = 4;
const PROFILE_RETRY_MS = 800;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadProfile(uid: string): Promise<AppUser | null> {
  for (let attempt = 0; attempt <= PROFILE_RETRIES; attempt++) {
    const profile = await getUserProfile(uid);
    if (profile) return profile;
    if (attempt < PROFILE_RETRIES) await wait(PROFILE_RETRY_MS);
  }
  return null;
}

/** Tracks who's signed in, with their account record. Someone with no
 *  record, or whose account an admin turned off, is signed straight out. */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [user, setUser] = useState<AppUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let current = 0; // ignores a slow profile load once someone else signed in
    return onAuthStateChanged(auth, async (firebaseUser) => {
      const run = ++current;
      if (!firebaseUser) {
        setUser(null);
        setStatus("signedOut");
        return;
      }
      try {
        const profile = await loadProfile(firebaseUser.uid);
        if (run !== current) return;
        if (!profile || !profile.isActive) {
          setNotice(
            profile?.replacedBy
              ? "Your password was reset by an admin. Please sign in with your new password."
              : profile
                ? "This account has been turned off. Please ask an admin for help."
                : "This sign-in isn't linked to a LINK Up account. Please ask an admin for help."
          );
          await signOutUser(); // fires this listener again with no user
          return;
        }
        setUser(profile);
        setStatus("signedIn");
        recordLogin(profile.uid).catch((err) => console.error("Failed to record sign-in time:", err));
      } catch (err) {
        console.error("Failed to load account:", err);
        if (run !== current) return;
        setNotice("Could not load your account. Please check your connection and sign in again.");
        await signOutUser();
      }
    });
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      notice,
      clearNotice: () => setNotice(null),
      signOut: signOutUser,
    }),
    [status, user, notice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
