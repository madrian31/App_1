export type RotationRole =
  | "presiderCouncil"
  | "speakerWorker"
  | "wedPresiderPool" // Youth OR Council Member, but never a Worker
  | "usherCategory"
  | "specialNumberCategory"
  | "flowerFamily";

/** One doc per role. `items` is an ORDERED list — index 0 is "current/next to
 *  assign". After an assignment, the assigned item moves to the back. Manual
 *  reassignment (picking someone out of turn) also moves that item to the
 *  back — everyone skipped keeps their place. */
export interface RotationQueue {
  id: RotationRole; // deterministic — same as role, one doc per role
  role: RotationRole;
  /** memberId for people-based roles (presider/speaker/flower), or a plain
   *  category string for category-based roles (usher/special number). */
  items: string[];
  dateModified: string; // ISO
}

/** Moves `usedId` to the back of the queue. If usedId isn't currently in the
 *  list (e.g. a member archived mid-queue), it's appended fresh at the back. */
export function advanceQueue(items: string[], usedId: string): string[] {
  const rest = items.filter((id) => id !== usedId);
  return [...rest, usedId];
}
