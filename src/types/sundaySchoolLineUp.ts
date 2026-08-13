export interface AssistantTeacherRef {
  memberId: string;
  memberName: string;
}

export interface SundaySchoolLineUpEntry {
  /** Deterministic: the ISO date itself — one lineup per Sunday, safe to re-save/edit. */
  id: string;

  date: string; // ISO date string, the Sunday being scheduled

  teacherId: string;
  teacherName: string;

  assistantTeachers: AssistantTeacherRef[];

  topic: string;
  notes?: string;

  // ── System / meta fields ──
  addedBy: string;
  dateAdded: string; // ISO, set once on first write
  dateModified: string; // ISO, updated on every edit
}