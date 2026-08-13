import { useEffect, useMemo, useState } from "react";
import { getAllChildren } from "../services/sundaySchool/sundaySchoolChildrenService";
import { getAttendanceForMonth, setAttendance } from "../services/sundaySchool/sundaySchoolAttendanceService";
import { displayChildName } from "../types/sundaySchoolChild";
import type { SundaySchoolChild } from "../types/sundaySchoolChild";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// TODO: replace with the actual logged-in user once auth/session wiring is in place.
const CURRENT_USER = "Unknown";

function getSundays(year: number, month: number): number[] {
  const sundays: number[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    if (date.getDay() === 0) sundays.push(date.getDate());
    date.setDate(date.getDate() + 1);
  }
  return sundays;
}

export default function useSundaySchoolAttendance() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [children, setChildren] = useState<SundaySchoolChild[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendance, setAttendanceState] = useState<Record<string, Record<number, boolean>>>({});
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Active Sunday School kids only — same collection/roster as SundaySchoolKidsMembers.
  // No age filter needed here: sundaySchoolChildren is already its own dedicated
  // roster, separate from MEMBERS, so isActive is the only signal that matters.
  useEffect(() => {
    let cancelled = false;
    setLoadingChildren(true);
    getAllChildren()
      .then((all) => {
        if (cancelled) return;
        const active = all
          .filter((c) => c.isActive)
          .sort((a, b) => displayChildName(a).localeCompare(displayChildName(b)));
        setChildren(active);
      })
      .catch((err) => {
        console.error("Failed to load Sunday School children:", err);
        if (!cancelled) setToast("Failed to load children.");
      })
      .finally(() => !cancelled && setLoadingChildren(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Attendance for whichever month is currently being viewed.
  useEffect(() => {
    let cancelled = false;
    setLoadingAttendance(true);
    getAttendanceForMonth(viewYear, viewMonth)
      .then((records) => {
        if (!cancelled) setAttendanceState(records);
      })
      .catch((err) => {
        console.error("Failed to load attendance:", err);
        if (!cancelled) setToast("Failed to load attendance.");
      })
      .finally(() => !cancelled && setLoadingAttendance(false));
    return () => {
      cancelled = true;
    };
  }, [viewYear, viewMonth]);

  const sundays = useMemo(() => getSundays(viewYear, viewMonth), [viewYear, viewMonth]);

  const filteredChildren = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return children;
    return children.filter((c) => displayChildName(c).toLowerCase().includes(q));
  }, [children, search]);

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  async function toggleAttendance(childId: string, day: number) {
    const wasPresent = Boolean(attendance[childId]?.[day]);
    const nextValue = !wasPresent;
    const prev = attendance;

    // optimistic update, same pattern as useSundaySchoolRoster.toggleActive
    setAttendanceState((cur) => ({
      ...cur,
      [childId]: {
        ...cur[childId],
        [day]: nextValue,
      },
    }));

    try {
      await setAttendance(viewYear, viewMonth, childId, day, nextValue, CURRENT_USER);
    } catch (err) {
      console.error("Failed to save attendance:", err);
      setAttendanceState(prev); // rollback
      setToast("Failed to save attendance.");
    }
  }

  return {
    viewYear,
    viewMonth,
    monthLabel: `${MONTHS[viewMonth]} ${viewYear}`,
    monthsShort: MONTHS_SHORT,
    sundays,
    goPrevMonth,
    goNextMonth,
    goToday,
    loading: loadingChildren || loadingAttendance,
    children: filteredChildren,
    totalActiveCount: children.length,
    attendance,
    search,
    onSearchChange: setSearch,
    toast,
    toggleAttendance,
  };
}
