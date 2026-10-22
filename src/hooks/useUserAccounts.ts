import { useEffect, useMemo, useState } from "react";
import {
  createUserAccount,
  listUserAccounts,
  resetUserPassword,
  setUserActive,
  updateUserAccount,
  type AccountChanges,
  type NewAccountInput,
  type ResetResult,
} from "../services/auth/userAccountsService";
import { authErrorMessage } from "../services/auth/authService";
import type { AppUser } from "../types/auth";

export default function useUserAccounts(currentUserName: string) {
  const [accounts, setAccounts] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    listUserAccounts()
      .then(setAccounts)
      .catch((err) => {
        console.error("Failed to load accounts:", err);
        setError("Failed to load accounts. Please refresh the page.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Guards against locking everyone out: the last active Super Admin can't
  // be turned off or given a lower role.
  const activeSuperAdminCount = useMemo(
    () => accounts.filter((a) => a.role === "superadmin" && a.isActive).length,
    [accounts]
  );

  function sortByName(list: AppUser[]) {
    return [...list].sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  /** Throws a plain-language Error, for the form to show. */
  async function create(input: NewAccountInput): Promise<AppUser> {
    try {
      const account = await createUserAccount(input, currentUserName);
      setAccounts((cur) => sortByName([...cur, account]));
      setToast(`Account made for ${account.displayName}.`);
      return account;
    } catch (err) {
      console.error("Failed to create account:", err);
      throw new Error(authErrorMessage(err), { cause: err });
    }
  }

  async function update(uid: string, changes: AccountChanges): Promise<void> {
    try {
      await updateUserAccount(uid, changes);
      setAccounts((cur) =>
        sortByName(
          cur.map((a) =>
            a.uid === uid
              ? { ...a, displayName: changes.displayName.trim(), role: changes.role, memberId: changes.memberId }
              : a
          )
        )
      );
      setToast("Account saved.");
    } catch (err) {
      console.error("Failed to update account:", err);
      throw new Error(authErrorMessage(err), { cause: err });
    }
  }

  async function setActive(account: AppUser, isActive: boolean) {
    const prev = accounts;
    setAccounts((cur) => cur.map((a) => (a.uid === account.uid ? { ...a, isActive } : a)));
    try {
      await setUserActive(account.uid, isActive);
      setToast(
        isActive
          ? `${account.displayName} can sign in again.`
          : `${account.displayName} can no longer sign in.`
      );
    } catch (err) {
      console.error("Failed to change account status:", err);
      setAccounts(prev);
      setToast(authErrorMessage(err));
    }
  }

  async function resetPassword(account: AppUser, newPassword: string): Promise<ResetResult> {
    try {
      const result = await resetUserPassword(account, newPassword);
      if (result.kind === "replaced") {
        setAccounts((cur) => cur.map((a) => (a.uid === account.uid ? result.account : a)));
      }
      return result;
    } catch (err) {
      console.error("Failed to reset password:", err);
      throw new Error(authErrorMessage(err), { cause: err });
    }
  }

  return { accounts, loading, error, toast, activeSuperAdminCount, create, update, setActive, resetPassword };
}
