import type { PraiseWorshipSkill } from "./praiseWorship";

export interface Member {
  id: string;

  // ── Basic Information (Directory columns 1–6) ──
  lastName: string;
  firstName: string;
  middleInitial: string; // M.I.
  gender: string;
  birthday: string; // ISO date string, e.g. "1990-05-24" — Age is computed from this, never stored
  dateOfBaptism?: string; // ISO date string — also doubles as "anniversary" for the monthly celebrants list

  // ── Church Information (Directory columns 8–13) ──
  facebookName?: string;
  status?: string; // e.g. "Working", "College", "Senior High School"
  category?: string; // e.g. "Men", "Women", "Youth Boys", "Youth Girls", "Young Adult/Young Professional"
  ministry?: string; // comma-separated list, e.g. "Sunday School, Ushering"
  isSmallGroupLeader: boolean; // Directory "Small Group" column: "Leader" or blank
  us2cgLevel?: string;

  // ── System / meta fields (used by app features, not part of the directory) ──
  addedBy: string;
  dateAdded: string; // ISO date string
  isArchived: boolean;
  isPledger: boolean;

  // ── Visitor ──
  // true = attends but isn't a member yet (created by the Attendance import
  // for names not found in the directory). Visitors live in the same
  // `members` collection so attendance works the same; Members pages and
  // the Attendance Report leave them out. Becomes false when the person
  // shows up in a Members import (they're in the directory now).
  isVisitor?: boolean;

  // ── Sunday School fields (used by Sunday School features, not part of the directory) ──
  isSundaySchoolTeacher: boolean;
  isSundaySchoolAssistantTeacher: boolean;

  // ── Program Line-up fields (rotation pools) ──
  isCouncilMember: boolean;
  isWorker: boolean;
  // true = unchecked in the Auto-Generate modal: still in the rotation
  // queues (keeps their place), but skipped when line-ups are auto-generated.
  // Stored as an exclusion so existing members default to included.
  excludeFromAutoLineUp?: boolean;

  // ── Praise & Worship ──
  // Left unset until someone is added/removed on the Praise & Worship page;
  // until then the `ministry` list decides (see isPraiseWorshipTeamMember).
  isPraiseWorshipMember?: boolean;
  // Positions this member can take in a line-up (keys of PW_SKILLS).
  praiseWorshipSkills?: PraiseWorshipSkill[];

  // ── Wedding Anniversary ──
  // ISO date string. Populated by the "BIRTHDAYS & ANNIVERSARIES" sheet import
  // (see anniversaryExcelMapper.ts) — matched to this member by name, confirmed
  // manually in AnniversaryImportPreviewModal before being written. Both spouses
  // in a couple get the same date on their own member record.
  weddingAnniversary?: string;
}

function ministryHas(m: Member, value: string): boolean {
  return (m.ministry ?? "").split(",").map((s) => s.trim().toLowerCase()).includes(value.toLowerCase());
}

/** True if `m` counts as a Council Member for rotation purposes — either the
 *  explicit boolean is set, or (for members imported before that field
 *  existed) the free-text `ministry` list contains "Council Member". */
export function isCouncilPoolMember(m: Member): boolean {
  return m.isCouncilMember || ministryHas(m, "Council Member");
}

/** Same idea as isCouncilPoolMember, but for Worker. */
export function isWorkerPoolMember(m: Member): boolean {
  return m.isWorker || ministryHas(m, "Worker");
}

/** Wednesday Presider pool: Youth OR Council Member, but never a Worker —
 *  even if that person is also Youth and/or Council. */
export function isWedPresiderPoolMember(m: Member): boolean {
  return (isCouncilPoolMember(m) || Boolean(m.category?.startsWith("Youth"))) && !isWorkerPoolMember(m);
}

/** On the Praise & Worship team. Once the P&W page has set
 *  isPraiseWorshipMember, that decides (so removing someone sticks even if
 *  their ministry text still says P&W). Before that, members already tagged
 *  "Praise & Worship" in the directory's ministry list count as on the team. */
export function isPraiseWorshipTeamMember(m: Member): boolean {
  return m.isPraiseWorshipMember ?? (ministryHas(m, "Praise & Worship") || ministryHas(m, "Praise and Worship"));
}

/** Anyone the auto-generator could assign as Presider or Speaker. */
export function isLineUpPoolMember(m: Member): boolean {
  return isCouncilPoolMember(m) || isWorkerPoolMember(m) || isWedPresiderPoolMember(m);
}

export interface MonthlyCelebrant {
  memberId: string;
  name: string;
  day: number; // day-of-month, for sorting
  type?: "birthday" | "anniversary"; // optional, for display purposes
}

/** Everyone whose birthday falls in `month` (0-indexed, matching JS Date),
 *  sorted by day. Re-runs automatically whenever the viewed month changes —
 *  not tied to any specific Sunday. */
export function getMonthlyCelebrants(members: Member[], month: number): MonthlyCelebrant[] {
  const out: MonthlyCelebrant[] = [];

  for (const m of members) {
    const name = `${m.firstName} ${m.lastName}`;

    if (m.birthday) {
      const d = new Date(`${m.birthday}T00:00:00`);
      if (!isNaN(d.getTime()) && d.getMonth() === month) {
        out.push({ memberId: m.id, name, day: d.getDate(), type: "birthday" });
      }
    }

    // Wedding anniversaries. Each spouse's own member record carries the same
    // date, so a couple who are both active members shows up as two rows.
    if (m.weddingAnniversary) {
      const d = new Date(`${m.weddingAnniversary}T00:00:00`);
      if (!isNaN(d.getTime()) && d.getMonth() === month) {
        out.push({ memberId: m.id, name, day: d.getDate(), type: "anniversary" });
      }
    }
  }

  return out.sort((a, b) => a.day - b.day);
}