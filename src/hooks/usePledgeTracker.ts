import { useEffect, useMemo, useRef, useState } from "react";
import { getAllMembers } from "../services/members/memberService/membersService";
import { getPledgesForMember, savePledge } from "../services/pledges/pledgesService";
import type { Member } from "../types/member";

export type RowSaveStatus = "saving" | "saved" | "error";

const SAVE_DEBOUNCE_MS = 800;
const SAVED_BADGE_MS = 1500;

/** Every Sunday in the given month, as ISO date strings ("2026-08-09"). */
function getSundaysInMonth(month: number, year: number): string[] {
  const out: string[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === 0) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

interface EntryState {
  amount: string;
  notes: string;
}

export default function usePledgeTracker(currentUser: string) {
  const now = new Date();

  const [pledgers, setPledgers] = useState<Member[]>([]);
  const [loadingPledgers, setLoadingPledgers] = useState(true);

  const [memberId, setMemberId] = useState("");
  const [curMonth, setCurMonth] = useState(now.getMonth());
  const [curYear, setCurYear] = useState(now.getFullYear());

  const [entries, setEntries] = useState<Record<string, EntryState>>({}); // keyed by ISO date
  const [rowStatus, setRowStatus] = useState<Record<string, RowSaveStatus | undefined>>({});
  const [loadingEntries, setLoadingEntries] = useState(false);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savedClearTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const years = Array.from({ length: 9 }, (_, i) => now.getFullYear() - 3 + i);

  const selectedMember = pledgers.find((m) => m.id === memberId) || null;
  const memberName = selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : "";

  useEffect(() => {
    setLoadingPledgers(true);
    getAllMembers()
      .then((all) => setPledgers(all.filter((m) => m.isPledger && !m.isArchived)))
      .catch((err) => console.error("Failed to load pledgers:", err))
      .finally(() => setLoadingPledgers(false));
  }, []);

  const sundays = useMemo(() => getSundaysInMonth(curMonth, curYear), [curMonth, curYear]);

  useEffect(() => {
    if (!memberId || sundays.length === 0) {
      setEntries({});
      return;
    }
    setLoadingEntries(true);
    getPledgesForMember(memberId, sundays[0], sundays[sundays.length - 1])
      .then((pledges) => {
        const map: Record<string, EntryState> = {};
        pledges.forEach((p) => {
          map[p.date] = { amount: String(p.amount ?? ""), notes: p.notes ?? "" };
        });
        setEntries(map);
      })
      .catch((err) => console.error("Failed to load pledges:", err))
      .finally(() => setLoadingEntries(false));
  }, [memberId, sundays]);

  // Cancel pending timers when switching member/month/year, so a stale save
  // doesn't land on the newly selected context.
  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout);
      saveTimers.current = {};
      Object.values(savedClearTimers.current).forEach(clearTimeout);
      savedClearTimers.current = {};
      setRowStatus({});
    };
  }, [memberId, curMonth, curYear]);

  function markSaving(date: string) {
    if (savedClearTimers.current[date]) {
      clearTimeout(savedClearTimers.current[date]);
      delete savedClearTimers.current[date];
    }
    setRowStatus((prev) => ({ ...prev, [date]: "saving" }));
  }

  function markSaved(date: string) {
    setRowStatus((prev) => ({ ...prev, [date]: "saved" }));
    savedClearTimers.current[date] = setTimeout(() => {
      setRowStatus((prev) => {
        const next = { ...prev };
        delete next[date];
        return next;
      });
      delete savedClearTimers.current[date];
    }, SAVED_BADGE_MS);
  }

  function markError(date: string) {
    setRowStatus((prev) => ({ ...prev, [date]: "error" }));
  }

  async function writeEntry(date: string, amount: string, notes: string) {
    if (!memberId || !memberName) return;
    markSaving(date);
    try {
      await savePledge(memberId, memberName, date, parseFloat(amount) || 0, notes, currentUser);
      markSaved(date);
    } catch (err) {
      console.error("Failed to save pledge:", err);
      markError(date);
    }
  }

  function scheduleSave(date: string, amount: string, notes: string) {
    if (saveTimers.current[date]) clearTimeout(saveTimers.current[date]);
    markSaving(date);
    saveTimers.current[date] = setTimeout(() => {
      delete saveTimers.current[date];
      writeEntry(date, amount, notes);
    }, SAVE_DEBOUNCE_MS);
  }

  function flushSave(date: string, amount: string, notes: string) {
    if (saveTimers.current[date]) {
      clearTimeout(saveTimers.current[date]);
      delete saveTimers.current[date];
    }
    writeEntry(date, amount, notes);
  }

  function handleAmountChange(date: string, value: string) {
    if (!memberId) return;
    setEntries((prev) => ({ ...prev, [date]: { ...prev[date], amount: value } }));
    scheduleSave(date, value, entries[date]?.notes || "");
  }

  function handleNotesChange(date: string, value: string) {
    if (!memberId) return;
    setEntries((prev) => ({ ...prev, [date]: { ...prev[date], notes: value } }));
    scheduleSave(date, entries[date]?.amount || "", value);
  }

  function commitAmount(date: string, value: string) {
    if (!memberId) return;
    flushSave(date, value, entries[date]?.notes || "");
  }

  function commitNotes(date: string, value: string) {
    if (!memberId) return;
    flushSave(date, entries[date]?.amount || "", value);
  }

  const total = sundays.reduce((sum, d) => sum + (parseFloat(entries[d]?.amount || "0") || 0), 0);
  const paidCount = sundays.filter((d) => (parseFloat(entries[d]?.amount || "0") || 0) > 0).length;

  function exportCSV() {
    let csv = "Name,Date,Amount,Notes\n";
    sundays.forEach((d) => {
      const e = entries[d] || { amount: "", notes: "" };
      const dateLabel = new Date(`${d}T00:00:00`).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const notes = (e.notes || "").replace(/"/g, '""');
      csv += `${memberName},${dateLabel},${e.amount || "0"},"${notes}"\n`;
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `pledges_${memberName.replace(/\s+/g, "_") || "member"}_${curMonth + 1}_${curYear}.csv`;
    a.click();
  }

  return {
    pledgers,
    loadingPledgers,
    memberId,
    setMemberId,
    memberName,
    curMonth,
    setCurMonth,
    curYear,
    setCurYear,
    years,
    sundays,
    entries,
    rowStatus,
    loadingEntries,
    handleAmountChange,
    handleNotesChange,
    commitAmount,
    commitNotes,
    total,
    paidCount,
    exportCSV,
  };
}
