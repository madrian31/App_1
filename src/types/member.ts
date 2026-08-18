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

  // ── Sunday School fields (used by Sunday School features, not part of the directory) ──
  isSundaySchoolTeacher: boolean;
  isSundaySchoolAssistantTeacher: boolean;

  // ── Program Line-up fields (rotation pools) ──
  isCouncilMember: boolean;
  isWorker: boolean;
}

export interface MonthlyCelebrant {
  memberId: string;
  name: string;
  day: number; // day-of-month, for sorting
  type: "birthday" | "anniversary";
}

/** Everyone whose birthday OR baptism anniversary falls in `month` (0-indexed,
 *  matching JS Date), sorted by day. Re-runs automatically whenever the
 *  viewed month changes — not tied to any specific Sunday. A member with
 *  both a birthday and an anniversary in the same month appears twice. */
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

    // if (m.dateOfBaptism) {
    //   const d = new Date(`${m.dateOfBaptism}T00:00:00`);
    //   if (!isNaN(d.getTime()) && d.getMonth() === month) {
    //     out.push({ memberId: m.id, name, day: d.getDate(), type: "Date Of Baptism" });
    //   }
    // }
  }

  return out.sort((a, b) => a.day - b.day);
}