import { resolveProgramType } from "../../types/programLineUp";
import type { NewProgramLineUpEntry } from "../../types/programLineUp";
import type { Member } from "../../types/member";
import type { RotationRole } from "../../types/rotationQueue";

export type QueueSnapshot = Record<RotationRole, string[]>;

/** Every Sunday and Wednesday between dateFrom and dateTo, inclusive. */
export function getServiceDatesInRange(dateFrom: string, dateTo: string): string[] {
  const out: string[] = [];
  const d = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T00:00:00`);
  while (d <= end) {
    const day = d.getDay();
    if (day === 0 || day === 3) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function nameFor(members: Member[], id: string): string {
  const m = members.find((x) => x.id === id);
  return m ? `${m.firstName} ${m.lastName}` : id;
}

/** Takes the front of a queue and returns the advanced version (front moved
 *  to the back) alongside the picked id. Returns null if the queue is empty
 *  — there's nothing eligible to assign for that role. */
function pickAndAdvance(queue: string[]): { current: string; rest: string[] } | null {
  if (queue.length === 0) return null;
  const [current, ...rest] = queue;
  return { current, rest: [...rest, current] };
}

export interface GenerateBatchResult {
  entries: NewProgramLineUpEntry[];
  finalQueues: QueueSnapshot;
  skippedDates: string[]; // already had a saved entry, or a required pool was empty
}

/**
 * Generates line-ups for every service date in range, working through
 * in-memory copies of the queues so each date's pick advances the queue
 * before the next date is generated — otherwise every date in the batch
 * would get the same "front of queue" person.
 *
 * Dates that already have a saved entry (`existingDates`) are left alone —
 * this never overwrites a manually-edited line-up.
 */
export function generateLineUpBatch(
  dateFrom: string,
  dateTo: string,
  members: Member[],
  categoryOptions: string[],
  startingQueues: QueueSnapshot,
  existingDates: Set<string>,
  currentUser: string
): GenerateBatchResult {
  const dates = getServiceDatesInRange(dateFrom, dateTo);
  const queues: QueueSnapshot = { ...startingQueues };
  const entries: NewProgramLineUpEntry[] = [];
  const skippedDates: string[] = [];
  const nowISO = new Date().toISOString();

  for (const date of dates) {
    if (existingDates.has(date)) {
      skippedDates.push(date);
      continue;
    }

    const programType = resolveProgramType(date);

    if (programType === "prayerMeeting") {
      const presiderPick = pickAndAdvance(queues.wedPresiderPool ?? []);
      const speakerPick = pickAndAdvance(queues.presiderCouncil ?? []); // Wed speaker uses the Council pool
      if (!presiderPick || !speakerPick) {
        skippedDates.push(date);
        continue;
      }
      queues.wedPresiderPool = presiderPick.rest;
      queues.presiderCouncil = speakerPick.rest;

      entries.push({
        id: date,
        date,
        programType,
        presider: { id: presiderPick.current, name: nameFor(members, presiderPick.current) },
        speaker: { id: speakerPick.current, name: nameFor(members, speakerPick.current) },
        addedBy: currentUser,
        dateAdded: nowISO,
      });
    } else {
      const presiderPick = pickAndAdvance(queues.presiderCouncil ?? []);
      const speakerPick = pickAndAdvance(queues.speakerWorker ?? []);
      if (!presiderPick || !speakerPick) {
        skippedDates.push(date);
        continue;
      }
      queues.presiderCouncil = presiderPick.rest;
      queues.speakerWorker = speakerPick.rest;

      const specialPick = pickAndAdvance(queues.specialNumberCategory ?? []);
      const usherPick = pickAndAdvance(queues.usherCategory ?? []);
      const flowerPick = pickAndAdvance(queues.flowerFamily ?? []);
      if (specialPick) queues.specialNumberCategory = specialPick.rest;
      if (usherPick) queues.usherCategory = usherPick.rest;
      if (flowerPick) queues.flowerFamily = flowerPick.rest;

      entries.push({
        id: date,
        date,
        programType,
        presider: { id: presiderPick.current, name: nameFor(members, presiderPick.current) },
        speaker: { id: speakerPick.current, name: nameFor(members, speakerPick.current) },
        specialNumber: specialPick ? { id: specialPick.current, name: specialPick.current } : undefined,
        usher: usherPick ? { id: usherPick.current, name: usherPick.current } : undefined,
        flowerFamily: flowerPick ? { id: flowerPick.current, name: flowerPick.current } : undefined,
        addedBy: currentUser,
        dateAdded: nowISO,
      });
    }
  }

  return { entries, finalQueues: queues, skippedDates };
}
