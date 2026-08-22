import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const PAGE_SIZE = 10;

export interface AttendanceTrackee {
  id: string;
  name: string;
}

export interface UseAttendanceTrackerConfig<T extends AttendanceTrackee> {
  /** Firestore collection holding the people/entities to track (e.g. "MEMBERS", "SS_CHILDREN"). */
  trackeeCollectionName: string;
  /** Firestore collection where per-month attendance docs are stored (one doc per trackee per month). */
  attendanceCollectionName: string;
  /** Extra query constraints for the trackee collection (e.g. where("isArchived", "==", false)). */
  trackeeQueryConstraints?: QueryConstraint[];
  /** Build a trackee record (with display name) from a Firestore doc. Return null to skip the doc. */
  mapTrackee: (id: string, data: Record<string, unknown>) => T | null;
}

function getSundays(year: number, month: number): number[] {
  const sundays: number[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    if (date.getDay() === 0) sundays.push(date.getDate());
    date.setDate(date.getDate() + 1);
  }
  return sundays;
}

/**
 * Reusable "Sundays this month" attendance tracker.
 *
 * Handles: fetching the list of trackees, fetching/saving per-day attendance
 * for the viewed month, search, sorting by attendance, and pagination.
 *
 * UI-agnostic — pair with <AttendanceCard /> or any custom presentation.
 */
export default function useAttendanceTracker<T extends AttendanceTrackee>(
  config: UseAttendanceTrackerConfig<T>
) {
  const { trackeeCollectionName, attendanceCollectionName, trackeeQueryConstraints = [], mapTrackee } = config;

  const now = new Date();

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [trackees, setTrackees] = useState<T[]>([]);
  const [loadingTrackees, setLoadingTrackees] = useState(true);
  const [attendance, setAttendance] = useState<Record<string, Record<string, Record<number, boolean>>>>({});
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const monthKey = `${viewYear}-${viewMonth}`;
  const sundays = useMemo(() => getSundays(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = `${MONTHS[viewMonth]} ${viewYear}`;

  // Reset to first page whenever the search term or the viewed month changes,
  // so the user isn't stranded on an out-of-range page.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, viewYear, viewMonth]);

  // Fetch trackees.
  useEffect(() => {
    let cancelled = false;

    async function loadTrackees() {
      try {
        const q = query(collection(db, trackeeCollectionName), ...trackeeQueryConstraints);
        const snapshot = await getDocs(q);
        const list: T[] = [];
        snapshot.forEach((docSnap) => {
          const mapped = mapTrackee(docSnap.id, docSnap.data() as Record<string, unknown>);
          if (mapped) list.push(mapped);
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setTrackees(list);
      } catch (err) {
        console.error(`Failed to load ${trackeeCollectionName} for attendance:`, err);
      } finally {
        if (!cancelled) setLoadingTrackees(false);
      }
    }

    loadTrackees();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackeeCollectionName]);

  // Fetch attendance for the currently viewed month, one doc per trackee per month.
  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      setLoadingAttendance(true);
      try {
        const q = query(collection(db, attendanceCollectionName), where("monthKey", "==", monthKey));
        const snapshot = await getDocs(q);
        const monthData: Record<string, Record<number, boolean>> = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as { trackeeId?: string; days?: Record<string, boolean> };
          if (!data.trackeeId) return;
          const days: Record<number, boolean> = {};
          if (data.days) {
            Object.entries(data.days).forEach(([dayStr, val]) => {
              days[Number(dayStr)] = !!val;
            });
          }
          monthData[data.trackeeId] = days;
        });

        if (!cancelled) {
          setAttendance((prev) => ({ ...prev, [monthKey]: monthData }));
        }
      } catch (err) {
        console.error(`Failed to load attendance from ${attendanceCollectionName}:`, err);
      } finally {
        if (!cancelled) setLoadingAttendance(false);
      }
    }

    loadAttendance();
    return () => {
      cancelled = true;
    };
  }, [attendanceCollectionName, monthKey]);

  const toggleAttendance = async (trackeeId: string, day: number) => {
    const previousValue = attendance[monthKey]?.[trackeeId]?.[day] ?? false;
    const newValue = !previousValue;

    // Optimistic local update
    setAttendance((prev) => {
      const monthData = prev[monthKey] ?? {};
      const trackeeData = monthData[trackeeId] ?? {};
      return {
        ...prev,
        [monthKey]: { ...monthData, [trackeeId]: { ...trackeeData, [day]: newValue } },
      };
    });

    try {
      const docId = `${trackeeId}_${monthKey}`;
      const attendanceDocRef = doc(db, attendanceCollectionName, docId);
      await setDoc(
        attendanceDocRef,
        { trackeeId, monthKey, year: viewYear, month: viewMonth, days: { [day]: newValue } },
        { merge: true }
      );
    } catch (err) {
      console.error("Failed to save attendance:", err);
      // Revert local state if the save failed
      setAttendance((prev) => {
        const monthData = prev[monthKey] ?? {};
        const trackeeData = monthData[trackeeId] ?? {};
        return {
          ...prev,
          [monthKey]: { ...monthData, [trackeeId]: { ...trackeeData, [day]: previousValue } },
        };
      });
    }
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const filteredTrackees = trackees.filter((t) =>
    t.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const sortedTrackees = useMemo(() => {
    return [...filteredTrackees]
      .map((trackee) => ({
        trackee,
        total: sundays.filter((day) => attendance[monthKey]?.[trackee.id]?.[day]).length,
      }))
      .sort((a, b) => {
        // Pinaka-madalas dumalo muna sa taas; pantay = alphabetical
        if (b.total !== a.total) return b.total - a.total;
        return a.trackee.name.localeCompare(b.trackee.name);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTrackees, sundays, attendance, monthKey]);

  const totalPages = Math.max(1, Math.ceil(sortedTrackees.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const start = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedTrackees = sortedTrackees.slice(start, start + PAGE_SIZE);

  return {
    loading: loadingTrackees || loadingAttendance,

    viewMonth,
    monthLabel,
    sundays,
    monthKey,
    goPrevMonth,
    goNextMonth,

    search,
    onSearchChange: setSearch,

    attendance,
    toggleAttendance,

    paginatedTrackees,
    filteredCount: sortedTrackees.length,
    currentPage: safeCurrentPage,
    totalPages,
    start,
    goFirst: () => setCurrentPage(1),
    goPrev: () => setCurrentPage((p) => Math.max(1, p - 1)),
    goNext: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    goLast: () => setCurrentPage(totalPages),
  };
}
