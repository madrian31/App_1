import { useEffect, useMemo, useState } from "react";
import { getAllPledges } from "../services/pledges/pledgesService";
import { addLedgerEntry, getLedgerEntries } from "../services/ledger/ledgerService";
import { getAllMembers } from "../services/members/memberService/membersService";
import { EMPTY_LEDGER_FORM, isLedgerFormComplete, toNewLedgerEntry, type LedgerEntryForm } from "./useLedger";
import type { Pledge } from "../types/pledge";
import type { LedgerEntry } from "../types/ledger";
import type { Member } from "../types/member";
import { getSundaysInMonth, toLocalISODate } from "../utils/date";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Month index (0-11) of a "YYYY-MM-DD" string. */
function monthOf(iso: string): number {
  return Number(iso.slice(5, 7)) - 1;
}

export interface MemberReportRow {
  memberId: string;
  memberName: string;
  yearTotal: number;
  monthTotals: number[]; // 12 entries, Jan..Dec
  sundaysPaid: number[]; // 12 entries — Sundays with an amount, per month
  periodTotal: number; // the selected month, or the whole year
  /** The selected month's collections, keyed by Sunday ("YYYY-MM-DD"). Empty when All Months. */
  bySunday: Record<string, { amount: number; notes: string }>;
}

/**
 * Drives the Pledges Report: one year at a time, optionally narrowed to one month.
 * Every figure on the page (cards, member chart, tables) follows the selected month;
 * the monthly chart always shows the whole year so another month can be picked.
 *
 * Pledge money is pooled: what comes in is per member (Pledge Tracker), what goes out
 * is one Pledges Ledger entry per purchase — added from here or from the Ledger page.
 */
export default function usePledgesReport(currentUser: string) {
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | null>(null); // null = All Months

  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [pledgers, setPledgers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false); // true after the first load, so refetches keep the page in place
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0); // bump to refetch after adding an entry

  // "Add Entry" form — a Pledges Ledger entry (expense, donation, …)
  const [entryForm, setEntryForm] = useState<LedgerEntryForm | null>(null); // null = closed
  const [savingEntry, setSavingEntry] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  const years =Array.from({ length: 9 }, (_, i) => now.getFullYear() - 5 + i);

  // Current pledgers, so someone who hasn't given yet still shows up (with "—").
  useEffect(() => {
    getAllMembers()
      .then((all) => setPledgers(all.filter((m) => m.isPledger && !m.isArchived)))
      .catch((err) => console.error("Failed to load pledgers:", err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    Promise.all([getAllPledges(from, to), getLedgerEntries("pledges", from, to)])
      .then(([p, l]) => {
        if (cancelled) return;
        setPledges(p);
        setLedger(l);
        setLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load pledges report:", err);
        setError("Could not load the report. Please refresh the page and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, reloadKey]);

  function selectYear(y: number) {
    setYear(y);
    setMonth(null);
  }

  /** Clicking the month that's already selected goes back to All Months. */
  function toggleMonth(m: number) {
    setMonth((cur) => (cur === m ? null : m));
  }

  const inPeriod = (iso: string) => month === null || monthOf(iso) === month;

  const sundaysPerMonth = useMemo(() => MONTHS.map((_, m) => getSundaysInMonth(m, year)), [year]);
  const periodSundays = month === null ? [] : sundaysPerMonth[month];

  const monthTotals = useMemo(() => {
    const totals = Array(12).fill(0) as number[];
    pledges.forEach((p) => (totals[monthOf(p.date)] += p.amount || 0));
    return totals;
  }, [pledges]);

  // ── Members ──
  const rows = useMemo<MemberReportRow[]>(() => {
    const map = new Map<string, MemberReportRow>();
    const rowFor = (memberId: string, memberName: string) => {
      let row = map.get(memberId);
      if (!row) {
        row = {
          memberId,
          memberName,
          yearTotal: 0,
          monthTotals: Array(12).fill(0),
          sundaysPaid: Array(12).fill(0),
          periodTotal: 0,
          bySunday: {},
        };
        map.set(memberId, row);
      }
      return row;
    };

    pledgers.forEach((m) => rowFor(m.id, `${m.firstName} ${m.lastName}`));
    pledges.forEach((p) => {
      const row = rowFor(p.memberId, p.memberName);
      const amount = p.amount || 0;
      const m = monthOf(p.date);
      row.yearTotal += amount;
      row.monthTotals[m] += amount;
      if (amount > 0) row.sundaysPaid[m] += 1;
      if (month === null || m === month) row.periodTotal += amount;
      if (m === month) row.bySunday[p.date] = { amount, notes: p.notes || "" };
    });

    // Same order whichever month is picked: biggest givers for the year first.
    return Array.from(map.values()).sort(
      (a, b) => b.yearTotal - a.yearTotal || a.memberName.localeCompare(b.memberName)
    );
  }, [pledgers, pledges, month]);

  // ── Cards (follow the selected month) ──
  // What the pledgers gave (Pledge Tracker) — the member chart and table add up to this.
  const pledgeTotal = month === null ? monthTotals.reduce((s, n) => s + n, 0) : monthTotals[month];

  const periodLedger = ledger.filter((e) => inPeriod(e.dateAdded)); // already oldest first
  const sumOf = (type: LedgerEntry["type"]) =>
    periodLedger.filter((e) => e.type === type).reduce((s, e) => s + e.amount, 0);
  const totalExpenses = sumOf("EXPENSE");
  const totalLoanOut = sumOf("LOAN_OUT");
  const totalRepayment = sumOf("REPAYMENT");
  const totalDonations = sumOf("DONATION"); // from people who aren't pledgers

  const totalCollected = pledgeTotal + totalDonations;
  const netBalance = totalCollected - totalExpenses - totalLoanOut + totalRepayment;

  const activePledgers = rows.filter((r) => r.periodTotal > 0).length;
  const avgPerPledger = activePledgers > 0 ? pledgeTotal / activePledgers : 0;

  const periodLabel = month === null ? `All of ${year}` : `${MONTHS[month]} ${year}`;

  /** Today if it falls in the period being viewed, otherwise the period's first day —
   *  so a new entry shows up in the list the user is looking at. */
  function defaultEntryDate(): string {
    const today = toLocalISODate(new Date());
    const from = toLocalISODate(new Date(year, month ?? 0, 1));
    const to = toLocalISODate(month === null ? new Date(year, 11, 31) : new Date(year, month + 1, 0));
    return today >= from && today <= to ? today : from;
  }

  function openEntryForm() {
    setEntryForm({ ...EMPTY_LEDGER_FORM, dateAdded: defaultEntryDate() });
    setEntryError(null);
  }

  function closeEntryForm() {
    setEntryForm(null);
    setEntryError(null);
  }

  function updateEntryForm<K extends keyof LedgerEntryForm>(key: K, value: LedgerEntryForm[K]) {
    setEntryForm((f) => (f ? { ...f, [key]: value } : f));
  }

  const canSaveEntry = !!entryForm && isLedgerFormComplete(entryForm);

  async function saveEntry() {
    if (!entryForm || !canSaveEntry) return;
    setSavingEntry(true);
    setEntryError(null);
    try {
      await addLedgerEntry(toNewLedgerEntry(entryForm, "pledges", currentUser));
      closeEntryForm();
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to add pledges ledger entry:", err);
      setEntryError("Could not save this entry. Please try again.");
    } finally {
      setSavingEntry(false);
    }
  }

  function exportCSV() {
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const money = (n: number) => n.toFixed(2);
    const sundayLabel = (iso: string) =>
      new Date(`${iso}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" });

    const headers = month === null ? MONTHS_SHORT : periodSundays.map(sundayLabel);
    const cells = (r: MemberReportRow) =>
      month === null ? r.monthTotals : periodSundays.map((d) => r.bySunday[d]?.amount || 0);

    let csv = `${q(`Pledges Report — ${periodLabel}`)}\n\n`;
    csv += ["Member", ...headers.map(q), "Total"].join(",") + "\n";
    rows.forEach((r) => {
      csv += [q(r.memberName), ...cells(r).map(money), money(r.periodTotal)].join(",") + "\n";
    });
    const columnTotals = headers.map((_, i) => rows.reduce((s, r) => s + cells(r)[i], 0));
    csv += ["Total", ...columnTotals.map(money), money(pledgeTotal)].join(",") + "\n\n";
    if (totalDonations) {
      csv += `From Pledgers,${money(pledgeTotal)}\nDonations,${money(totalDonations)}\n`;
    }
    csv += `Total Collected,${money(totalCollected)}\n`;
    csv += `Total Expenses,${money(totalExpenses)}\n`;
    if (totalLoanOut || totalRepayment) {
      csv += `Loaned Out,${money(totalLoanOut)}\nRepaid,${money(totalRepayment)}\n`;
    }
    csv += `Net Balance,${money(netBalance)}\n`;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download =
      month === null
        ? `pledges_report_${year}.csv`
        : `pledges_report_${year}${String(month + 1).padStart(2, "0")}.csv`;
    a.click();
  }

  return {
    year,
    selectYear,
    years,
    month,
    setMonth,
    toggleMonth,
    periodLabel,
    loading,
    loaded,
    error,
    sundaysPerMonth,
    periodSundays,
    monthTotals,
    rows,
    pledgeTotal,
    totalDonations,
    totalCollected,
    totalExpenses,
    totalLoanOut,
    totalRepayment,
    netBalance,
    activePledgers,
    avgPerPledger,
    periodLedger,
    entryForm,
    savingEntry,
    entryError,
    canSaveEntry,
    openEntryForm,
    closeEntryForm,
    updateEntryForm,
    saveEntry,
    exportCSV,
  };
}
