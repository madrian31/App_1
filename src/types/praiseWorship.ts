import type { RoleAssignment } from "./programLineUp";

/** What a team member can take on — a member can have several (e.g. Lead
 *  Singer + Acoustic Guitar). The keys are stored on
 *  Member.praiseWorshipSkills, so only ever change the labels, not the keys. */
export const PW_SKILLS = [
  { key: "leadSinger", label: "Lead Singer" },
  { key: "backupSinger", label: "Backup Singer" },
  { key: "musicDirector", label: "Music Director" },
  { key: "leadGuitar", label: "Lead Guitar" },
  { key: "rhythmGuitar", label: "Rhythm Guitar" },
  { key: "acousticGuitar", label: "Acoustic Guitar" },
  { key: "midiKeyboard", label: "Midi Keyboard" },
  { key: "piano", label: "Piano" },
  { key: "strings", label: "Violin/Strings" },
  { key: "drums", label: "Drums" },
  { key: "percussions", label: "Percussions" },
  { key: "bassGuitar", label: "Bass Guitar" },
  { key: "mixerTech", label: "Mixer Tech" },
  { key: "multimediaTech", label: "Multimedia Tech" },
] as const;

export type PraiseWorshipSkill = (typeof PW_SKILLS)[number]["key"];

export function skillLabel(skill: PraiseWorshipSkill): string {
  return PW_SKILLS.find((s) => s.key === skill)?.label ?? skill;
}

export interface PwSlot {
  key: string; // stored as the key in PraiseWorshipLineUpEntry.assignments
  label: string;
  skill: PraiseWorshipSkill; // whose members are suggested first for this slot
  multiple?: boolean; // more than one person (Backup Singers)
}

/** The line-up positions, in the order the team posts them. Several slots
 *  can draw from the same skill (Rhythm Guitar 1 and 2). */
export const PW_SLOTS: PwSlot[] = [
  { key: "leadSinger", label: "Lead Singer", skill: "leadSinger" },
  { key: "backupSingers", label: "Backup Singers", skill: "backupSinger", multiple: true },
  { key: "musicDirector", label: "Music Director", skill: "musicDirector" },
  { key: "leadGuitarist", label: "Lead Guitarist", skill: "leadGuitar" },
  { key: "rhythmGuitar1", label: "Rhythm Guitar 1", skill: "rhythmGuitar" },
  { key: "rhythmGuitar2", label: "Rhythm Guitar 2", skill: "rhythmGuitar" },
  { key: "acousticGuitar1", label: "Acoustic Guitar 1", skill: "acousticGuitar" },
  { key: "acousticGuitar2", label: "Acoustic Guitar 2", skill: "acousticGuitar" },
  { key: "midiKeyboard", label: "Midi Keyboard", skill: "midiKeyboard" },
  { key: "piano", label: "Piano", skill: "piano" },
  { key: "strings", label: "Violin/Strings", skill: "strings" },
  { key: "drums", label: "Drums", skill: "drums" },
  { key: "percussions", label: "Percussions", skill: "percussions" },
  { key: "bassGuitar", label: "Bass Guitar", skill: "bassGuitar" },
  { key: "mixerTech", label: "Mixer Tech", skill: "mixerTech" },
  { key: "multimediaTech", label: "Multimedia Tech", skill: "multimediaTech" },
];

export interface PraiseWorshipSong {
  title: string;
  artist?: string; // who sings/recorded it, e.g. "Victory Worship"
}

/** Songs as stored — line-ups saved before artists were added hold plain
 *  title strings, so those are turned into { title } here. */
export function normalizeSongs(raw: unknown): PraiseWorshipSong[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s): PraiseWorshipSong | null => {
      if (typeof s === "string") return { title: s };
      if (s && typeof s === "object" && typeof (s as PraiseWorshipSong).title === "string") {
        const { title, artist } = s as PraiseWorshipSong;
        return artist ? { title, artist } : { title };
      }
      return null;
    })
    .filter((s): s is PraiseWorshipSong => s !== null && s.title.trim() !== "");
}

/** "Papuri Kay Yahweh - Victory Worship", or just the title. */
export function formatSong(song: PraiseWorshipSong): string {
  return song.artist ? `${song.title} - ${song.artist}` : song.title;
}

export interface PraiseWorshipLineUpEntry {
  /** Deterministic: the ISO service date itself — one line-up per date. */
  id: string;
  date: string; // ISO date

  /** Slot key (PW_SLOTS) -> who's on it. Every slot is an array so Backup
   *  Singers (several people) and single slots are handled the same way. */
  assignments: Record<string, RoleAssignment[]>;
  songs: PraiseWorshipSong[]; // in the order they'll be sung

  practiceDate?: string; // ISO date
  practiceTime?: string; // "HH:mm", 24-hour

  // ── System / meta fields ──
  addedBy: string;
  dateAdded: string; // ISO, set once on first save
  dateModified: string; // ISO, updated on every save
}

export type NewPraiseWorshipLineUpEntry = Omit<PraiseWorshipLineUpEntry, "dateAdded" | "dateModified">;

/** "16:00" -> "4 PM", "16:30" -> "4:30 PM". */
function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

/** "Saturday, 4 PM" — the way the team writes it in the group chat. */
export function formatPracticeTime(practiceDate?: string, practiceTime?: string): string {
  const parts: string[] = [];
  if (practiceDate) {
    parts.push(new Date(`${practiceDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" }));
  }
  if (practiceTime) parts.push(formatTime12h(practiceTime));
  return parts.join(", ");
}

/** The line-up as plain text, ready to paste in the team's group chat. */
export function formatLineUpMessage(lineUp: {
  date: string;
  assignments: Record<string, RoleAssignment[]>;
  songs: PraiseWorshipSong[];
  practiceDate?: string;
  practiceTime?: string;
}): string {
  const serviceDate = new Date(`${lineUp.date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const roles = PW_SLOTS.map((slot) => {
    const names = (lineUp.assignments[slot.key] ?? []).map((a) => a.name).join(", ");
    return names ? `${slot.label}: ${names}` : `${slot.label}:`;
  });
  const practice = formatPracticeTime(lineUp.practiceDate, lineUp.practiceTime);

  return [
    `Praise & Worship — ${serviceDate}`,
    "",
    ...roles,
    "",
    "**Line-up",
    ...lineUp.songs.map((s) => `* ${formatSong(s)}`),
    "",
    "**Prax Time",
    practice ? `- ${practice}` : "-",
  ].join("\n");
}
