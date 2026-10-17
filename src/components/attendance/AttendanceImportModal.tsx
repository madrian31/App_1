import { useMemo, useState } from "react";
import type { UseAttendanceImportResult } from "../../hooks/useAttendanceImport";
import type { ImportPerson, Resolution, ResolutionNote } from "../../utils/attendanceImportPlan";
import type { Member } from "../../types/member";

interface AttendanceImportModalProps {
  importer: UseAttendanceImportResult;
  /** Closes the modal. The page reloads attendance when closing after an import attempt. */
  onClose: () => void;
}

type PeopleFilter = "all" | "review" | "visitors" | "skipped";

const PAGE_SIZE = 25;

const NOTE_LABEL: Record<ResolutionNote, { text: string; tone: "ok" | "warn" | "new" | "muted" }> = {
  exactMember: { text: "Matched", tone: "ok" },
  suggestedMember: { text: "Check spelling", tone: "warn" },
  ambiguousMember: { text: "Same name as 2+ members", tone: "warn" },
  newVisitor: { text: "New visitor", tone: "new" },
  suggestedSameAs: { text: "Possible duplicate", tone: "warn" },
  noAttendance: { text: "No check marks", tone: "muted" },
};

const NEEDS_REVIEW: ResolutionNote[] = ["suggestedMember", "ambiguousMember", "suggestedSameAs"];

function encode(r: Resolution): string {
  switch (r.kind) {
    case "member":
      return `member:${r.memberId}`;
    case "sameAs":
      return `same:${r.personKey}`;
    case "newVisitor":
      return "visitor";
    default:
      return "skip";
  }
}

function decode(value: string): Resolution {
  if (value.startsWith("member:")) return { kind: "member", memberId: value.slice(7) };
  if (value.startsWith("same:")) return { kind: "sameAs", personKey: value.slice(5) };
  if (value === "visitor") return { kind: "newVisitor" };
  return { kind: "skip" };
}

function memberLabel(m: Member): string {
  const name = [m.lastName, m.firstName].filter(Boolean).join(", ");
  const tags = [m.isVisitor ? "Visitor" : "", m.isArchived ? "Archived" : ""].filter(Boolean);
  return tags.length ? `${name} (${tags.join(", ")})` : name;
}

export default function AttendanceImportModal({ importer, onClose }: AttendanceImportModalProps) {
  const {
    step,
    error,
    fileName,
    sheets,
    skippedSheets,
    selectedMonths,
    toggleMonth,
    members,
    people,
    resolutions,
    notes,
    setResolution,
    keepExistingChecks,
    setKeepExistingChecks,
    plan,
    progress,
    summary,
    confirmImport,
  } = importer;

  const [filter, setFilter] = useState<PeopleFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => memberLabel(a).localeCompare(memberLabel(b))),
    [members]
  );
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const counts = useMemo(() => {
    let matched = 0;
    let visitors = 0;
    let skipped = 0;
    let review = 0;
    for (const p of people) {
      const r = resolutions[p.key];
      if (r.kind === "member") matched++;
      else if (r.kind === "newVisitor") visitors++;
      else if (r.kind === "skip") skipped++;
      if (NEEDS_REVIEW.includes(notes[p.key])) review++;
    }
    return { matched, visitors, skipped, review };
  }, [people, resolutions, notes]);

  const visitorTargets = useMemo(
    () => people.filter((p) => resolutions[p.key].kind === "newVisitor"),
    [people, resolutions]
  );

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => {
      const r = resolutions[p.key];
      if (filter === "review" && !NEEDS_REVIEW.includes(notes[p.key])) return false;
      if (filter === "visitors" && r.kind !== "newVisitor" && r.kind !== "sameAs") return false;
      if (filter === "skipped" && r.kind !== "skip") return false;
      if (q && !p.spellings.some((s) => s.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [people, resolutions, notes, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPeople.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagePeople = filteredPeople.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(f: PeopleFilter) {
    setFilter(f);
    setPage(1);
  }

  function renderResolutionSelect(p: ImportPerson) {
    const r = resolutions[p.key];
    return (
      <select
        className="aimp-select"
        value={encode(r)}
        onChange={(e) => setResolution(p.key, decode(e.target.value))}
        aria-label={`What to do with ${p.displayName}`}
      >
        <option value="visitor">+ Add as new visitor</option>
        <option value="skip">Skip (don't import)</option>
        {visitorTargets.some((v) => v.key !== p.key) && (
          <optgroup label="Same person as a new visitor in this file">
            {visitorTargets
              .filter((v) => v.key !== p.key)
              .map((v) => (
                <option key={v.key} value={`same:${v.key}`}>
                  {v.displayName}
                </option>
              ))}
          </optgroup>
        )}
        <optgroup label="Existing members">
          {sortedMembers.map((m) => (
            <option key={m.id} value={`member:${m.id}`}>
              {memberLabel(m)}
            </option>
          ))}
        </optgroup>
      </select>
    );
  }

  const canImport = selectedMonths.size > 0 && (plan.writes.length > 0 || plan.newVisitorKeys.length > 0);

  return (
    <div className="aimp-overlay" role="dialog" aria-modal="true" aria-labelledby="aimp-title">
      <div className="aimp-dialog">
        <div className="aimp-header">
          <div>
            <h2 id="aimp-title">Import Attendance</h2>
            {fileName && <p className="aimp-subtitle">{fileName}</p>}
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close"
            disabled={step === "importing"}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="aimp-body">
          {step === "parsing" && (
            <div className="empty-state">
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
              <p>Reading the file and matching names…</p>
            </div>
          )}

          {step === "error" && (
            <div className="aimp-error">
              <p>{error}</p>
              {skippedSheets.length > 0 && (
                <details>
                  <summary>Sheets that were checked ({skippedSheets.length})</summary>
                  <ul>
                    {skippedSheets.map((s) => (
                      <li key={s.sheetName}>
                        <strong>{s.sheetName}</strong>: {s.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {step === "importing" && (
            <div className="empty-state">
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
              <p>
                Saving… {progress ? `${progress.done} / ${progress.total}` : ""}
              </p>
            </div>
          )}

          {step === "done" && summary && (
            <div className="aimp-done">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              <p>Attendance imported.</p>
              <ul>
                <li>{summary.checksAdded} check marks added</li>
                {summary.checksRemoved > 0 && <li>{summary.checksRemoved} check marks removed</li>}
                <li>{summary.visitorsCreated} new visitors added</li>
                <li>{summary.attendanceDocsWritten} member-months updated</li>
              </ul>
            </div>
          )}

          {step === "preview" && (
            <>
              <section className="aimp-section">
                <h3>Months found</h3>
                <div className="aimp-months">
                  {sheets.map((s) => (
                    <label key={s.monthKey} className={`aimp-month${selectedMonths.has(s.monthKey) ? " is-on" : ""}`}>
                      <input
                        type="checkbox"
                        checked={selectedMonths.has(s.monthKey)}
                        onChange={() => toggleMonth(s.monthKey)}
                      />
                      <span className="aimp-month-label">{s.label}</span>
                      <span className="aimp-month-meta">
                        {s.sundays.length} Sundays · {s.presentCount} ✓
                      </span>
                    </label>
                  ))}
                </div>

                {sheets.some((s) => s.warnings.length > 0) && (
                  <ul className="aimp-warnings">
                    {sheets.flatMap((s) =>
                      s.warnings.map((w, i) => (
                        <li key={`${s.monthKey}-${i}`}>
                          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> <strong>{s.sheetName}:</strong> {w}
                        </li>
                      ))
                    )}
                  </ul>
                )}

                {skippedSheets.length > 0 && (
                  <details className="aimp-skipped">
                    <summary>{skippedSheets.length} sheets not imported</summary>
                    <ul>
                      {skippedSheets.map((s) => (
                        <li key={s.sheetName}>
                          <strong>{s.sheetName}</strong>: {s.reason}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>

              <section className="aimp-section">
                <div className="aimp-stats">
                  <div><strong>{counts.matched}</strong><span>matched to members</span></div>
                  <div><strong>{counts.visitors}</strong><span>new visitors</span></div>
                  <div className={counts.review > 0 ? "is-warn" : ""}><strong>{counts.review}</strong><span>to review</span></div>
                  <div><strong>{counts.skipped}</strong><span>skipped</span></div>
                  <div><strong>+{plan.checksAdded}</strong><span>check marks added</span></div>
                  <div className={plan.checksRemoved > 0 ? "is-warn" : ""}><strong>−{plan.checksRemoved}</strong><span>check marks removed</span></div>
                </div>

                <label className="aimp-option">
                  <input
                    type="checkbox"
                    checked={keepExistingChecks}
                    onChange={(e) => setKeepExistingChecks(e.target.checked)}
                  />
                  Only add check marks — never uncheck attendance that's already saved in the app
                </label>
              </section>

              <section className="aimp-section">
                <div className="aimp-people-toolbar">
                  <div className="aimp-tabs" role="tablist">
                    {(
                      [
                        ["all", `All (${people.length})`],
                        ["review", `To review (${counts.review})`],
                        ["visitors", "Visitors"],
                        ["skipped", `Skipped (${counts.skipped})`],
                      ] as [PeopleFilter, string][]
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        role="tab"
                        aria-selected={filter === key}
                        className={`aimp-tab${filter === key ? " is-active" : ""}`}
                        onClick={() => changeFilter(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="attendance-search-wrap">
                    <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Search name in file…"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="table-scroll">
                  <table className="members-table aimp-table">
                    <thead>
                      <tr>
                        <th>Name in file</th>
                        <th>Present</th>
                        <th>Status</th>
                        <th>Import as</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagePeople.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="empty-cell">
                            <div className="empty-state">
                              <p>Nothing here.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pagePeople.map((p) => {
                          const note = NOTE_LABEL[notes[p.key]];
                          const r = resolutions[p.key];
                          const matched = r.kind === "member" ? memberById.get(r.memberId) : undefined;
                          return (
                            <tr key={p.key}>
                              <td>
                                <span className="member-name">{p.displayName}</span>
                                {p.spellings.length > 1 && (
                                  <span className="aimp-alt" title={p.spellings.join("\n")}>
                                    also: {p.spellings.filter((s) => s !== p.displayName).join("; ")}
                                  </span>
                                )}
                                {p.match.kind === "ambiguous" && p.match.candidates.length > 0 && (
                                  <span className="aimp-alt">
                                    could be: {p.match.candidates.map((m) => memberLabel(m)).join(" / ")}
                                  </span>
                                )}
                              </td>
                              <td className="total-col">{p.presentCount}</td>
                              <td>
                                <span className={`aimp-badge aimp-badge--${note.tone}`}>{note.text}</span>
                                {matched?.isVisitor && <span className="aimp-badge aimp-badge--new">Visitor</span>}
                                {matched?.isArchived && <span className="aimp-badge aimp-badge--muted">Archived</span>}
                              </td>
                              <td>{renderResolutionSelect(p)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="table-footer">
                    <div className="footer-left">
                      <span>{filteredPeople.length} names</span>
                    </div>
                    <div className="page-nav">
                      <button className="page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page">
                        <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                      </button>
                      <span className="page-indicator">
                        Page {safePage} of {totalPages}
                      </span>
                      <button className="page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page">
                        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <div className="aimp-footer">
          {step === "preview" && (
            <>
              <button className="aimp-btn" onClick={onClose}>
                Cancel
              </button>
              <button className="aimp-btn aimp-btn--primary" onClick={confirmImport} disabled={!canImport}>
                Import {plan.checksAdded + plan.checksRemoved} changes
                {plan.newVisitorKeys.length > 0 ? ` + ${plan.newVisitorKeys.length} visitors` : ""}
              </button>
            </>
          )}
          {step === "done" && (
            <button className="aimp-btn aimp-btn--primary" onClick={onClose}>
              Done
            </button>
          )}
          {step === "error" && (
            <button className="aimp-btn" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
