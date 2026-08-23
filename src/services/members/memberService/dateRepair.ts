import { parseMembersFile } from "./memberImportExport";
import { getAllMembers, updateMember } from "./membersService";
import type { Member } from "../../../types/member";

export interface RepairRow {
  memberId: string; // existing Firestore doc id — NEVER recomputed, always preserved
  name: string;
  field: "birthday" | "dateOfBaptism";
  oldValue: string;
  newValue: string;
}

function nameKey(lastName: string, firstName: string): string {
  return `${lastName.trim().toLowerCase()}|${firstName.trim().toLowerCase()}`;
}

/**
 * Compares the corrected dates from the Excel file (parsed with the FIXED
 * toIsoDate) against what's currently stored in Firestore, matched by
 * lastName+firstName — NOT by recomputing buildMemberId(), since that would
 * produce a different id for anyone whose birthday was previously off by a
 * day, and silently orphan them from Pledges/Visits/etc. Matching by name
 * and updating via the EXISTING doc id keeps every relationship intact.
 *
 * Ambiguous matches (two+ existing members sharing the exact same
 * lastName+firstName) are skipped and reported separately, since we can't
 * safely tell which one the file row refers to.
 */
export async function buildDateRepairPlan(
  file: File
): Promise<{ rows: RepairRow[]; ambiguous: string[]; unmatched: string[] }> {
  const [parseResult, existingMembers] = await Promise.all([parseMembersFile(file), getAllMembers()]);

  const byName = new Map<string, Member[]>();
  for (const m of existingMembers) {
    const key = nameKey(m.lastName, m.firstName);
    const list = byName.get(key) ?? [];
    list.push(m);
    byName.set(key, list);
  }

  const rows: RepairRow[] = [];
  const ambiguous: string[] = [];
  const unmatched: string[] = [];

  for (const parsedRow of parseResult.rows) {
    const { lastName, firstName, birthday, dateOfBaptism } = parsedRow.data;
    const key = nameKey(lastName, firstName);
    const candidates = byName.get(key);
    const displayName = `${firstName} ${lastName}`;

    if (!candidates || candidates.length === 0) {
      unmatched.push(displayName);
      continue;
    }
    if (candidates.length > 1) {
      ambiguous.push(displayName);
      continue;
    }

    const existing = candidates[0];

    if (birthday && (existing.birthday || "") !== birthday) {
      rows.push({
        memberId: existing.id,
        name: displayName,
        field: "birthday",
        oldValue: existing.birthday || "(blank)",
        newValue: birthday,
      });
    }
    if (dateOfBaptism && (existing.dateOfBaptism || "") !== dateOfBaptism) {
      rows.push({
        memberId: existing.id,
        name: displayName,
        field: "dateOfBaptism",
        oldValue: existing.dateOfBaptism || "(blank)",
        newValue: dateOfBaptism,
      });
    }
  }

  return { rows, ambiguous, unmatched };
}

export async function applyDateRepairs(
  rows: RepairRow[],
  onProgress?: (done: number, total: number) => void
): Promise<number> {
  const byMember = new Map<string, Partial<Member>>();
  for (const r of rows) {
    const patch = byMember.get(r.memberId) ?? {};
    (patch as any)[r.field] = r.newValue;
    byMember.set(r.memberId, patch);
  }

  let done = 0;
  const total = byMember.size;
  for (const [memberId, patch] of byMember) {
    await updateMember(memberId, patch);
    done++;
    onProgress?.(done, total);
  }
  return done;
}