import type { CalendarEvent } from "../types/calendarEvent";

function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

function parseICSDate(raw: string): { date: string; time: string } {
  const y = raw.slice(0, 4);
  const mo = raw.slice(4, 6);
  const da = raw.slice(6, 8);
  const dateStr = `${y}-${mo}-${da}`;
  let timeStr = "09:00";
  if (raw.length > 8) {
    const t = raw.split("T")[1] || "";
    if (t.length >= 4) timeStr = `${t.slice(0, 2)}:${t.slice(2, 4)}`;
  }
  return { date: dateStr, time: timeStr };
}

function addOneHour(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  const nextHour = (parseInt(h, 10) + 1) % 24;
  return `${pad(nextHour)}:${m}`;
}

/**
 * Parses raw .ics text into CalendarEvent objects. Malformed VEVENT blocks
 * (missing SUMMARY/DTSTART) are skipped rather than throwing, so one bad
 * entry doesn't fail the whole import.
 */
export function parseICS(text: string): CalendarEvent[] {
  const results: CalendarEvent[] = [];
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const blocks = unfolded.split("BEGIN:VEVENT").slice(1);

  blocks.forEach((raw) => {
    const block = raw.split("END:VEVENT")[0];
    const summaryMatch = block.match(/SUMMARY:(.*)/);
    const startMatch = block.match(/DTSTART[^:]*:(\d{8}T?\d{0,6})/);
    const endMatch = block.match(/DTEND[^:]*:(\d{8}T?\d{0,6})/);
    const locMatch = block.match(/LOCATION:(.*)/);
    if (!summaryMatch || !startMatch) return;

    const title = summaryMatch[1].trim().replace(/\\,/g, ",").replace(/\\n/g, " ").replace(/\\;/g, ";");
    const rawStart = startMatch[1].trim();
    const startParsed = parseICSDate(rawStart);
    const endParsed = endMatch ? parseICSDate(endMatch[1].trim()) : null;
    const endTime = endParsed && endParsed.date === startParsed.date ? endParsed.time : addOneHour(startParsed.time);
    // ICS marks a whole-day event with a date-only value (8 digits, no "T...").
    const isAllDay = rawStart.length === 8;

    results.push({
      id: Math.random().toString(36).slice(2),
      date: startParsed.date,
      start: isAllDay ? "00:00" : startParsed.time,
      end: isAllDay ? "23:59" : endTime,
      allDay: isAllDay,
      title: title || "Untitled Event",
      cat: "events", // ICS has no concept of our categories — default bucket, user can re-categorize later
      location: locMatch ? locMatch[1].trim() : "",
    });
  });

  return results;
}