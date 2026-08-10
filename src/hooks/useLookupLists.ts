import { useEffect, useState } from "react";
import { LOOKUP_LISTS, type LookupListKey } from "../types/lookupList";
import { getLookupList, saveLookupList, seedLookupListIfEmpty } from "../services/settings/lookupListsService";

/** Seeded once per list, only if Firestore doesn't have that list yet — based on the
 *  values already in use across existing member records. Safe to edit anytime after. */
const SEED_VALUES: Record<LookupListKey, string[]> = {
  status: [
    "Elementary",
    "Junior High School",
    "Senior High School",
    "College",
    "Working Student",
    "Working",
    "Worker",
    "Senior",
  ],
  category: ["Men", "Women", "Youth Boys", "Youth Girls", "Young Adult/Young Professional"],
  us2cgLevel: ["SALT 1", "SALT 2", "SALT 3", "Pre-RDSR", "Post-RDSR", "SOLD 3", "M2M"],
  ministry: [
    "Worker",
    "Sunday School",
    "Praise & Worship",
    "Multimedia",
    "Ushering",
    "Council Member",
    "Youth Officer",
    "Tambourine Dancer",
  ],
};

type ListsState = Record<LookupListKey, string[]>;

const EMPTY_STATE: ListsState = { status: [], category: [], us2cgLevel: [], ministry: [] };

export default function useLookupLists() {
  const [lists, setLists] = useState<ListsState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<LookupListKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all(LOOKUP_LISTS.map((l) => seedLookupListIfEmpty(l.key, SEED_VALUES[l.key])));
      const entries = await Promise.all(
        LOOKUP_LISTS.map(async (l) => [l.key, await getLookupList(l.key)] as const)
      );
      setLists(Object.fromEntries(entries) as ListsState);
    } catch (err) {
      console.error("Failed to load lookup lists:", err);
      setError("Failed to load lists.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function persist(key: LookupListKey, values: string[]) {
    const prev = lists[key];
    setSavingKey(key);
    setLists((cur) => ({ ...cur, [key]: values })); // optimistic
    try {
      await saveLookupList(key, values);
    } catch (err) {
      console.error("Failed to save list:", err);
      setLists((cur) => ({ ...cur, [key]: prev })); // rollback
      setError("Failed to save changes. Please try again.");
    } finally {
      setSavingKey(null);
    }
  }

  function addValue(key: LookupListKey, value: string) {
    const trimmed = value.trim();
    if (!trimmed || lists[key].includes(trimmed)) return;
    persist(key, [...lists[key], trimmed]);
  }

  function removeValue(key: LookupListKey, value: string) {
    persist(key, lists[key].filter((v) => v !== value));
  }

  function renameValue(key: LookupListKey, oldValue: string, newValue: string) {
    const trimmed = newValue.trim();
    if (!trimmed || trimmed === oldValue) return;
    if (lists[key].includes(trimmed)) return; // avoid duplicate entries
    persist(key, lists[key].map((v) => (v === oldValue ? trimmed : v)));
  }

  return { lists, loading, savingKey, error, addValue, removeValue, renameValue, refetch: loadAll };
}