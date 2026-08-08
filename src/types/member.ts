export interface Member {
  id: string;

  // ── Basic Information (Directory columns 1–6) ──
  lastName: string;
  firstName: string;
  middleInitial: string; // M.I.
  gender: string;
  birthday: string; // ISO date string, e.g. "1990-05-24" — Age is computed from this, never stored
  dateOfBaptism?: string; // ISO date string

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
}