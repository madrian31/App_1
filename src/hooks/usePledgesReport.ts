import { useEffect, useMemo, useState } from "react";
import { getAllPledges } from "../services/pledges/pledgesService";
import type { Pledge } from "../types/pledge";

export type QuickRange = "thisMonth" | "last3Months" | "thisYear" | "custom";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthStartISO(year: number, month: number): string {
  return new Date(year, month, 1).toISOString().slice(0, 10);
}
function monthEndISO(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().slice(0, 10);
}

function resolveQuickRange(range: QuickRange, now: Date) {
  const m = now.getMonth();
  const y = now.getFullYear();
  switch (range) {
    case "thisMonth":
      return { fromMonth: m, fromYear: y, toMonth: m, toYear: y };
    case "last3Months": {
      const d = new Date(y, m - 2, 1);
      return { fromMonth: d.getMonth(), fromYear: d.getFullYear(), toMonth: m, toYear: y };
    }
    case "thisYear":
      return { fromMonth: 0, fromYear: y, toMonth: 11, toYear: y };
    case "custom":
    default:
      return { fromMonth: m, fromYear: y, toMonth: m, toYear: y };
  }
}

export interface MonthRow {
  key: string;
  label: string;
  total: number;
}

export interface MemberRow {
  memberId: string;
  memberName: string;
  total: number;
  sundaysPaid: number;
}

export default function usePledgesReport() {
  const now = new Date();
  const initial = resolveQuickRange("thisMonth", now);

  const [quickRange, setQuickRange] = useState<QuickRange>("thisMonth");
  const [fromMonth, setFromMonthState] = useState(initial.fromMonth);
  const [fromYear, setFromYearState] = useState(initial.fromYear);
  const [toMonth, setToMonthState] = useState(initial.toMonth);
  const [toYear, setToYearState] = useState(initial.toYear);

  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const years = Array.from({ length: 9 }, (_, i) => now.getFullYear() - 5 + i);

  function onQuickRangeChange(range: QuickRange) {
    setQuickRange(range);
    if (range !== "custom") {
      const r = resolveQuickRange(range, now);
      setFromMonthState(r.fromMonth);
      setFromYearState(r.fromYear);
      setToMonthState(r.toMonth);
      setToYearState(r.toYear);
    }
  }

  // Any manual change to the month/year pickers switches the range to "custom"
  // so the quick-range chips stop overriding the user's selection.
  function setFromMonth(m: number) { setFromMonthState(m); setQuickRange("custom"); }
  function setFromYear(y: number) { setFromYearState(y); setQuickRange("custom"); }
  function setToMonth(m: number) { setToMonthState(m); setQuickRange("custom"); }
  function setToYear(y: number) { setToYearState(y); setQuickRange("custom"); }

  const dateFrom = monthStartISO(fromYear, fromMonth);
  const dateTo = monthEndISO(toYear, toMonth);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAllPledges(dateFrom, dateTo)
      .then(setPledges)
      .catch((err) => {
        console.error("Failed to load pledges report:", err);
        setError("Failed to load report data.");
      })
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  // ── Summary ──
  const grandTotal = useMemo(() => pledges.reduce((s, p) => s + (p.amount || 0), 0), [pledges]);
  const activePledgers = useMemo(
    () => new Set(pledges.filter((p) => p.amount > 0).map((p) => p.memberId)).size,
    [pledges]
  );
  const avgPerPledger = activePledgers > 0 ? grandTotal / activePledgers : 0;

  // ── Breakdown by month ──
  const byMonth = useMemo<MonthRow[]>(() => {
    const map = new Map<string, number>();
    pledges.forEach((p) => {
      const d = new Date(`${p.date}T00:00:00`);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + (p.amount || 0));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, total]) => {
        const [y, m] = key.split("-").map(Number);
        return { key, label: `${MONTHS_SHORT[m - 1]} ${y}`, total };
      });
  }, [pledges]);

  // ── Breakdown by member ──
  const byMember = useMemo<MemberRow[]>(() => {
    const map = new Map<string, MemberRow>();
    pledges.forEach((p) => {
      if (!map.has(p.memberId)) {
        map.set(p.memberId, { memberId: p.memberId, memberName: p.memberName, total: 0, sundaysPaid: 0 });
      }
      const row = map.get(p.memberId)!;
      row.total += p.amount || 0;
      if (p.amount > 0) row.sundaysPaid += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [pledges]);

  function exportCSV() {
    let csv = `Pledges Report,${MONTHS[fromMonth]} ${fromYear} to ${MONTHS[toMonth]} ${toYear}\n\n`;
    csv += "Member,Total,Sundays Paid\n";
    byMember.forEach((r) => {
      csv += `${r.memberName},${r.total.toFixed(2)},${r.sundaysPaid}\n`;
    });
    csv += `\nGrand Total,${grandTotal.toFixed(2)}\n`;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `pledges_report_${fromYear}${String(fromMonth + 1).padStart(2, "0")}_${toYear}${String(toMonth + 1).padStart(2, "0")}.csv`;
    a.click();
  }

  return {
    quickRange,
    onQuickRangeChange,
    fromMonth,
    setFromMonth,
    fromYear,
    setFromYear,
    toMonth,
    setToMonth,
    toYear,
    setToYear,
    years,
    loading,
    error,
    grandTotal,
    activePledgers,
    avgPerPledger,
    byMonth,
    byMember,
    exportCSV,
  };
}
