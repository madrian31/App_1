import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getAllMembers } from "../services/members/memberService/membersService";
import { getLineUpForDate } from "../services/programLineUp/programLineUpService";
import { getPraiseWorshipLineUp } from "../services/praiseWorship/praiseWorshipLineUpService";
import { getAllEvents } from "../services/calendar/calendarEventsService";
import { getAllCategories } from "../services/calendar/calendarCategoriesService";
import { phHolidaysExcept } from "../data/phHolidays";
import { getMonthlyCelebrants, type Member, type MonthlyCelebrant } from "../types/member";
import type { ProgramLineUpEntry, RoleAssignment } from "../types/programLineUp";
import type { PraiseWorshipLineUpEntry } from "../types/praiseWorship";
import type { CalendarCategoryItem, CalendarEvent } from "../types/calendarEvent";
import { FOLLOW_UP_MISSED_SUNDAYS } from "./useMembersAttendanceReport";
import { addDays, iso, timeToMinutes } from "./useCalendar";

const ATTENDANCE_COLLECTION = "membersAttendance";

/** How many weeks back to look for the latest Sunday with attendance recorded. */
const SUNDAYS_LOOKBACK = 8;
/** Upcoming services (Sundays and Wednesdays) shown with their line-up. */
const SERVICES_SHOWN = 2;
/** Calendar events from today through this many days ahead. */
export const EVENTS_DAYS_AHEAD = 14;

export interface DashboardSunday {
  date: string; // ISO
  members: number; // active members marked present
  visitors: number;
}

export interface DashboardAttendance {
  /** Most recent Sunday with any attendance recorded; null if none in the lookback window. */
  latest: DashboardSunday | null;
  /** The recorded Sunday before `latest`, for comparison. */
  previous: DashboardSunday | null;
  /** A past Sunday newer than `latest` that has nothing recorded yet. Today doesn't count —
   *  attendance is usually encoded after the service. */
  unrecordedSunday: string | null;
  totalMembers: number;
  /** Sundays this month that have attendance recorded. */
  monthSundays: number;
  monthRate: number | null; // 0–100
  monthAverage: number | null; // members present per Sunday
  /** Active members absent on each of the last FOLLOW_UP_MISSED_SUNDAYS recorded Sundays;
   *  null until that many Sundays have been recorded. */
  followUp: { id: string; name: string }[] | null;
  followUpSundays: string[]; // ISO, newest first
}

export interface DashboardService {
  date: string; // ISO
  entry: ProgramLineUpEntry | null; // null = no line-up saved for that date yet
}

export interface DashboardPraiseWorship {
  date: string; // ISO — the coming Sunday (today, if it's Sunday)
  entry: PraiseWorshipLineUpEntry | null; // null = no P&W line-up saved for that date yet
}

export interface DashboardCelebrant extends MonthlyCelebrant {
  date: string; // ISO date of this year's celebration
}

export interface DashboardEvent {
  event: CalendarEvent;
  category: CalendarCategoryItem | undefined;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fullName(m: Member): string {
  return `${m.firstName} ${m.lastName}`.trim();
}

/** The clean-up the old member import used to build ids like "malate-michael-1978-11-07". */
function toIdSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "lastname-firstname-birthday" — captures the name part. */
const OLD_MEMBER_ID = /^(.+)-(\d{4}-\d{2}-\d{2}|no-bday)$/;

function capitalizeWords(text: string): string {
  return text.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/**
 * Display name for a saved line-up role. Line-ups generated from rotation queues that still
 * hold old-style member ids have that id saved as the name (the generator couldn't find the
 * member), so look the person up by id first, then by the name inside the old id. Category
 * roles ("Men", "Youth Girls") pass through unchanged.
 */
function resolveRoleName(role: RoleAssignment, members: Member[]): string {
  const byId = members.find((m) => m.id === role.id);
  if (byId) return fullName(byId);

  const old = OLD_MEMBER_ID.exec(role.id) ?? OLD_MEMBER_ID.exec(role.name);
  if (!old) return role.name;

  const nameKey = old[1];
  const sameName = members.filter((m) => toIdSlug(`${m.lastName}-${m.firstName}`) === nameKey);
  const match =
    sameName.find((m) => toIdSlug(`${m.lastName}-${m.firstName}-${m.birthday || "no-bday"}`) === old[0]) ??
    sameName.find((m) => !m.isArchived) ??
    sameName[0];
  if (match) return fullName(match);

  // Not in the members list at all: best guess from the id itself ("malate-michael" -> "Michael Malate").
  const [last, ...first] = nameKey.split("-");
  return capitalizeWords([...first, last].join(" "));
}

function withResolvedNames(entry: ProgramLineUpEntry, members: Member[]): ProgramLineUpEntry {
  const fix = <T extends RoleAssignment | undefined>(role: T): T =>
    (role && { ...role, name: resolveRoleName(role, members) }) as T;
  return {
    ...entry,
    presider: fix(entry.presider),
    speaker: fix(entry.speaker),
    specialNumber: fix(entry.specialNumber),
    usher: fix(entry.usher),
    flowerFamily: fix(entry.flowerFamily),
  };
}

/** The most recent `count` Sundays up to `today` (today included), newest first. */
function recentSundays(today: Date, count: number): Date[] {
  const latest = addDays(today, -today.getDay());
  return Array.from({ length: count }, (_, i) => addDays(latest, -7 * i));
}

/** The next `count` Sunday / Wednesday service dates from `today` (today included). */
function nextServiceDates(today: Date, count: number): string[] {
  const out: string[] = [];
  for (let d = today; out.length < count; d = addDays(d, 1)) {
    if (d.getDay() === 0 || d.getDay() === 3) out.push(iso(d));
  }
  return out;
}

/**
 * Everything the Dashboard shows. Each section (people, line-ups, events) loads on its own,
 * so one slow or failed read doesn't hold up the rest of the page.
 *
 * Attendance only counts Sundays that have something recorded: a Sunday with nobody marked
 * present hasn't been encoded yet, and counting it would flag every member for follow-up.
 *
 * `includeAttendance` is false for regular Users: attendance is staff-only (the Firestore rules
 * refuse it), so it isn't asked for at all and the attendance sections stay hidden.
 */
export default function useDashboard(includeAttendance = true) {
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const todayISO = iso(today);
  const sundays = useMemo(() => recentSundays(today, SUNDAYS_LOOKBACK), [today]);
  const serviceDates = useMemo(() => nextServiceDates(today, SERVICES_SHOWN), [today]);

  // ── Members + attendance ──
  const [members, setMembers] = useState<Member[] | null>(null);
  // { [memberId]: { ["year-month"]: { [day]: present } } }
  const [attendanceDays, setAttendanceDays] = useState<Record<string, Record<string, Record<number, boolean>>>>({});
  const [peopleError, setPeopleError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const years = Array.from(new Set(sundays.map((d) => d.getFullYear())));
        const [allMembers, snapshot] = await Promise.all([
          getAllMembers(),
          includeAttendance
            ? getDocs(query(collection(db, ATTENDANCE_COLLECTION), where("year", "in", years)))
            : Promise.resolve(null),
        ]);

        const byMember: Record<string, Record<string, Record<number, boolean>>> = {};
        snapshot?.forEach((docSnap) => {
          const data = docSnap.data() as {
            trackeeId?: string;
            year?: number;
            month?: number;
            days?: Record<string, boolean>;
          };
          if (!data.trackeeId || data.year === undefined || data.month === undefined || !data.days) return;
          const days: Record<number, boolean> = {};
          Object.entries(data.days).forEach(([d, v]) => {
            days[Number(d)] = !!v;
          });
          if (!byMember[data.trackeeId]) byMember[data.trackeeId] = {};
          byMember[data.trackeeId][`${data.year}-${data.month}`] = days;
        });

        if (!cancelled) {
          setMembers(allMembers);
          setAttendanceDays(byMember);
        }
      } catch (err) {
        console.error("Failed to load members and attendance for the dashboard:", err);
        if (!cancelled) setPeopleError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sundays, includeAttendance]);

  const activeMembers = useMemo(
    () => (members ?? []).filter((m) => !m.isArchived && !m.isVisitor),
    [members]
  );

  const attendance = useMemo<DashboardAttendance | null>(() => {
    if (!members) return null;
    const visitors = members.filter((m) => !m.isArchived && m.isVisitor);
    const present = (id: string, d: Date) =>
      !!attendanceDays[id]?.[`${d.getFullYear()}-${d.getMonth()}`]?.[d.getDate()];

    type CountedSunday = DashboardSunday & { day: Date };
    const counted: CountedSunday[] = sundays.map((d) => ({
      day: d,
      date: iso(d),
      members: activeMembers.filter((m) => present(m.id, d)).length,
      visitors: visitors.filter((m) => present(m.id, d)).length,
    }));
    const recorded = counted.filter((s) => s.members + s.visitors > 0);
    const latest: CountedSunday | undefined = recorded[0];

    const unrecorded = counted.find(
      (s) => s.date < todayISO && s.members + s.visitors === 0 && (!latest || s.date > latest.date)
    );

    const thisMonth = recorded.filter(
      (s) => s.day.getFullYear() === today.getFullYear() && s.day.getMonth() === today.getMonth()
    );
    const monthPresent = thisMonth.reduce((sum, s) => sum + s.members, 0);
    const hasMonthData = thisMonth.length > 0 && activeMembers.length > 0;

    const followUpSundays = recorded.slice(0, FOLLOW_UP_MISSED_SUNDAYS);
    const followUp =
      followUpSundays.length < FOLLOW_UP_MISSED_SUNDAYS
        ? null
        : activeMembers
            .filter((m) => followUpSundays.every((s) => !present(m.id, s.day)))
            .map((m) => ({ id: m.id, name: fullName(m) }))
            .sort((a, b) => a.name.localeCompare(b.name));

    const summary = (s: CountedSunday | undefined): DashboardSunday | null =>
      s ? { date: s.date, members: s.members, visitors: s.visitors } : null;

    return {
      latest: summary(latest),
      previous: summary(recorded[1]),
      unrecordedSunday: unrecorded?.date ?? null,
      totalMembers: activeMembers.length,
      monthSundays: thisMonth.length,
      monthRate: hasMonthData ? Math.round((monthPresent / (thisMonth.length * activeMembers.length)) * 100) : null,
      monthAverage: hasMonthData ? Math.round(monthPresent / thisMonth.length) : null,
      followUp,
      followUpSundays: followUpSundays.map((s) => s.date),
    };
  }, [members, activeMembers, attendanceDays, sundays, today, todayISO]);

  // Birthdays and anniversaries: the next 7 days (even across the end of the month),
  // then the rest of this month.
  const celebrants = useMemo(() => {
    if (!members) return null;
    const weekEnd = addDays(today, 6);
    const months = [today, weekEnd]
      .map((d) => ({ year: d.getFullYear(), month: d.getMonth() }))
      .filter((p, i, arr) => i === 0 || p.month !== arr[0].month);

    const all: DashboardCelebrant[] = months.flatMap(({ year, month }) =>
      getMonthlyCelebrants(activeMembers, month).map((c) => ({
        ...c,
        date: `${year}-${pad(month + 1)}-${pad(c.day)}`,
      }))
    );
    const weekEndISO = iso(weekEnd);
    const monthPrefix = todayISO.slice(0, 7);

    return {
      thisWeek: all.filter((c) => c.date >= todayISO && c.date <= weekEndISO),
      laterThisMonth: all.filter((c) => c.date > weekEndISO && c.date.startsWith(monthPrefix)),
    };
  }, [members, activeMembers, today, todayISO]);

  // ── Upcoming service line-ups ──
  const [savedServices, setServices] = useState<DashboardService[] | null>(null);
  const [servicesError, setServicesError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const entries = await Promise.all(serviceDates.map((d) => getLineUpForDate(d)));
        if (!cancelled) setServices(serviceDates.map((date, i) => ({ date, entry: entries[i] })));
      } catch (err) {
        console.error("Failed to load upcoming line-ups for the dashboard:", err);
        if (!cancelled) setServicesError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [serviceDates]);

  // Names are resolved against the members list, so wait for it (unless it failed to load).
  const services = useMemo<DashboardService[] | null>(() => {
    if (!savedServices || (!members && !peopleError)) return null;
    return savedServices.map((s) => ({
      ...s,
      entry: s.entry && withResolvedNames(s.entry, members ?? []),
    }));
  }, [savedServices, members, peopleError]);

  // ── Praise & Worship line-up for the coming Sunday ──
  const praiseWorshipDate = useMemo(() => iso(addDays(today, (7 - today.getDay()) % 7)), [today]);
  const [praiseWorship, setPraiseWorship] = useState<DashboardPraiseWorship | null>(null);
  const [praiseWorshipError, setPraiseWorshipError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const entry = await getPraiseWorshipLineUp(praiseWorshipDate);
        if (!cancelled) setPraiseWorship({ date: praiseWorshipDate, entry });
      } catch (err) {
        console.error("Failed to load the Praise & Worship line-up for the dashboard:", err);
        if (!cancelled) setPraiseWorshipError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [praiseWorshipDate]);

  // ── Upcoming calendar events ──
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [categories, setCategories] = useState<CalendarCategoryItem[]>([]);
  const [eventsError, setEventsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [allEvents, allCategories] = await Promise.all([getAllEvents(), getAllCategories()]);
        if (!cancelled) {
          setEvents([...allEvents, ...phHolidaysExcept(allEvents)]);
          setCategories(allCategories);
        }
      } catch (err) {
        console.error("Failed to load calendar events for the dashboard:", err);
        if (!cancelled) setEventsError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingEvents = useMemo<DashboardEvent[] | null>(() => {
    if (!events) return null;
    const lastISO = iso(addDays(today, EVENTS_DAYS_AHEAD - 1));
    const byId = new Map(categories.map((c) => [c.id, c]));
    return events
      .filter((e) => e.date >= todayISO && e.date <= lastISO)
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          Number(!a.allDay) - Number(!b.allDay) ||
          timeToMinutes(a.start || "00:00") - timeToMinutes(b.start || "00:00")
      )
      .map((event) => ({ event, category: byId.get(event.cat) }));
  }, [events, categories, today, todayISO]);

  return {
    today,
    attendance,
    peopleError,
    celebrants,
    services,
    servicesError,
    praiseWorship,
    praiseWorshipError,
    upcomingEvents,
    eventsError,
  };
}
