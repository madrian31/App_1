import { useEffect, useMemo, useState } from "react";
import { toLocalISODate } from "../../utils/date";
import { getAllMembers } from "../../services/members/memberService/membersService";
import {
  isCouncilPoolMember,
  isLineUpPoolMember,
  isWorkerPoolMember,
  type Member,
} from "../../types/member";
import "../../pages/Pledges/pledgesMembers.css"; // shared checklist styles

function poolTags(m: Member): string[] {
  const tags: string[] = [];
  if (isCouncilPoolMember(m)) tags.push("Council");
  if (isWorkerPoolMember(m)) tags.push("Worker");
  if (m.category?.startsWith("Youth")) tags.push("Youth");
  return tags;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthStartISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month, 1));
}
function monthEndISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month + 1, 0));
}

interface AutoGenerateModalProps {
  generating: boolean;
  /** `excludedIds`: rotation members left unchecked — skipped by the generator. */
  onGenerate: (dateFrom: string, dateTo: string, excludedIds: string[]) => void;
  onClose: () => void;
}

export default function AutoGenerateModal({ generating, onGenerate, onClose }: AutoGenerateModalProps) {
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [fromMonth, setFromMonth] = useState(now.getMonth());
  const [fromYear, setFromYear] = useState(now.getFullYear());
  const [toMonth, setToMonth] = useState(nextMonthDate.getMonth());
  const [toYear, setToYear] = useState(nextMonthDate.getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i);

  const [poolMembers, setPoolMembers] = useState<Member[]>([]);
  const [loadingPool, setLoadingPool] = useState(true);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAllMembers()
      .then((all) => {
        if (cancelled) return;
        const pool = all
          .filter((m) => !m.isArchived && isLineUpPoolMember(m))
          .sort(
            (a, b) =>
              (a.lastName ?? "").localeCompare(b.lastName ?? "", undefined, { sensitivity: "base" }) ||
              (a.firstName ?? "").localeCompare(b.firstName ?? "", undefined, { sensitivity: "base" })
          );
        setPoolMembers(pool);
        setExcluded(new Set(pool.filter((m) => m.excludeFromAutoLineUp).map((m) => m.id)));
      })
      .catch((err) => console.error("Failed to load rotation members:", err))
      .finally(() => {
        if (!cancelled) setLoadingPool(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return poolMembers;
    return poolMembers.filter((m) =>
      `${m.firstName} ${m.middleInitial} ${m.lastName} ${m.lastName} ${m.firstName}`.toLowerCase().includes(q)
    );
  }, [poolMembers, search]);

  const includedCount = poolMembers.length - excluded.size;

  function toggle(id: string) {
    setExcluded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setAllVisible(include: boolean) {
    setExcluded((cur) => {
      const next = new Set(cur);
      visibleMembers.forEach((m) => (include ? next.delete(m.id) : next.add(m.id)));
      return next;
    });
  }

  function handleGenerate() {
    onGenerate(monthStartISO(fromYear, fromMonth), monthEndISO(toYear, toMonth), Array.from(excluded));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Auto-Generate Line-ups</h2>
        <p className="pledger-checklist-hint">
          Fills in every Sunday and Wednesday in this range using the current rotation — front of each queue,
          advancing automatically. Dates that already have a saved line-up are left untouched.
        </p>

        <div className="month-range-wrap" style={{ marginBottom: 18 }}>
          <div className="filter-select-wrap">
            <select value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div className="filter-select-wrap">
            <select value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <span className="month-range-arrow">→</span>

          <div className="filter-select-wrap">
            <select value={toMonth} onChange={(e) => setToMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div className="filter-select-wrap">
            <select value={toYear} onChange={(e) => setToYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <h3 className="autogen-pool-title">Include in rotation</h3>
        <p className="pledger-checklist-hint">
          Checked members can be assigned as Presider or Speaker. Unchecked members are skipped but keep their
          place in the rotation. Your choices are remembered for next time.
        </p>

        <div className="autogen-pool-toolbar">
          <div className="search-wrap">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" className="btn-secondary" onClick={() => setAllVisible(true)} disabled={loadingPool}>
            Check all
          </button>
          <button type="button" className="btn-secondary" onClick={() => setAllVisible(false)} disabled={loadingPool}>
            Uncheck all
          </button>
        </div>

        <div className="pledger-checklist">
          {loadingPool ? (
            <p className="pledger-checklist-empty">Loading members…</p>
          ) : visibleMembers.length === 0 ? (
            <p className="pledger-checklist-empty">
              {poolMembers.length === 0 ? "No Council, Worker, or Youth members yet." : "No matching members."}
            </p>
          ) : (
            visibleMembers.map((m) => (
              <label className="pledger-checklist-row" key={m.id}>
                <input type="checkbox" checked={!excluded.has(m.id)} onChange={() => toggle(m.id)} />
                <span className="pledger-checklist-name">
                  {m.lastName}
                  {m.lastName && m.firstName ? ", " : ""}
                  {m.firstName}
                  {m.middleInitial ? ` ${m.middleInitial}` : ""}
                </span>
                <span className="autogen-pool-tags">
                  {poolTags(m).map((t) => (
                    <span key={t} className="autogen-pool-tag">{t}</span>
                  ))}
                </span>
              </label>
            ))
          )}
        </div>

        <div className="modal-actions pledger-checklist-footer">
          <span className="pledger-checklist-count">
            {loadingPool ? "" : `${includedCount} of ${poolMembers.length} included`}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" onClick={onClose} disabled={generating}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleGenerate} disabled={generating || loadingPool}>
            {generating ? "Generating…" : "Generate"}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
