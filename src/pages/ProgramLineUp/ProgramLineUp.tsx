import { useState } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useProgramLineUp from "../../hooks/useProgramLineUp";
import LineUpRoleRow from "../../components/programLineUp/LineUpRoleRow";
import ReassignModal from "../../components/programLineUp/ReassignModal";
import MonthlyCelebrants from "../../components/programLineUp/MonthlyCelebrants";
import type { RoleAssignment, ProgramType } from "../../types/programLineUp";
import { sundayOccurrenceInMonth } from "../../types/programLineUp";
import "./programLineUp.css";

// TODO: replace with the actual logged-in user's name once auth/session
// wiring is in place — mirrors the TODO already in Ledger.tsx / PledgeTracker.tsx.
const CURRENT_USER = "Unknown";

const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  traditional: "Traditional",
  contemporary: "Contemporary",
  prayerMeeting: "Prayer Meeting",
};

const PROGRAM_TYPE_ICONS: Record<ProgramType, string> = {
  traditional: "fa-solid fa-scroll",
  contemporary: "fa-solid fa-wand-magic-sparkles",
  prayerMeeting: "fa-solid fa-hands-praying",
};

type ActiveReassign = "presider" | "speaker" | "specialNumber" | "usher" | "flowerFamily" | null;

export default function ProgramLineUp() {
  const {
    date,
    setDate,
    programType,
    loading,
    saving,
    toast,

    presider,
    speaker,
    specialNumber,
    usher,
    flowerFamily,

    themeTitle,
    setThemeTitle,
    themeVerse,
    setThemeVerse,
    announcements,
    setAnnouncements,
    monthlyCelebrants,

    presiderPool,
    speakerPool,
    usherPool,
    specialNumberPool,

    reassignPresider,
    reassignSpeaker,
    reassignSpecialNumber,
    reassignUsher,
    reassignFlowerFamily,

    submit,
  } = useProgramLineUp(CURRENT_USER);

  const [activeReassign, setActiveReassign] = useState<ActiveReassign>(null);
  const isSunday = programType !== "prayerMeeting";
  const isSecondSunday = sundayOccurrenceInMonth(date) === 2;
  const viewedMonth = new Date(`${date}T00:00:00`).getMonth();

  function closeReassign() {
    setActiveReassign(null);
  }

  function handleConfirm(pick: RoleAssignment) {
    if (activeReassign === "presider") reassignPresider(pick);
    if (activeReassign === "speaker") reassignSpeaker(pick);
    if (activeReassign === "specialNumber") reassignSpecialNumber(pick);
    if (activeReassign === "usher") reassignUsher(pick);
    if (activeReassign === "flowerFamily") reassignFlowerFamily(pick);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Program Line-up</h1>
              <p>Auto-generated from the rotation for the selected service date.</p>
            </div>
            <span className={`badge badge-${programType}`}>
              <i className={PROGRAM_TYPE_ICONS[programType]} aria-hidden="true" />
              {PROGRAM_TYPE_LABELS[programType]}
            </span>
          </div>

          <div className="toolbar">
            <div className="filter-select-wrap">
              <i className="fa-regular fa-calendar" aria-hidden="true" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ border: "none", background: "transparent" }} />
            </div>
            <button className="btn-add" onClick={submit} disabled={saving || loading}>
              <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
              {saving ? "Saving…" : "Save Line-up"}
            </button>
          </div>

          {toast && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {toast}
            </div>
          )}

          <div className="lineup-card">
            <LineUpRoleRow
              label="Presider"
              hint={isSunday ? "from Council pool" : "Youth/Council (not Worker)"}
              current={presider.current}
              upNext={presider.upNext}
              onReassign={() => setActiveReassign("presider")}
            />
            <LineUpRoleRow
              label="Speaker"
              hint={isSunday ? "from Worker pool" : "from Council pool"}
              current={speaker.current}
              upNext={speaker.upNext}
              onReassign={() => setActiveReassign("speaker")}
            />

            {isSunday && (
              <>
                <LineUpRoleRow
                  label="Special Number"
                  hint="category rotation"
                  current={specialNumber.current}
                  upNext={specialNumber.upNext}
                  onReassign={() => setActiveReassign("specialNumber")}
                />
                <LineUpRoleRow
                  label="Usher"
                  hint="category rotation"
                  current={usher.current}
                  upNext={usher.upNext}
                  onReassign={() => setActiveReassign("usher")}
                />
                <LineUpRoleRow
                  label="Flower Family"
                  hint="household rotation"
                  current={flowerFamily.current}
                  upNext={flowerFamily.upNext}
                  onReassign={() => setActiveReassign("flowerFamily")}
                />
                {isSecondSunday && (
                  <LineUpRoleRow
                    label="Tangkilik"
                    hint="all council — 2nd Sunday only"
                    current={{ id: "all", name: "All Council Members" }}
                    upNext={[]}
                  />
                )}
              </>
            )}
          </div>

          <div className="lineup-text-card">
            <div className="lineup-text-row">
              <div className="ledger-field">
                <label>Theme Title</label>
                <input
                  type="text"
                  placeholder="e.g. Guided by God's Wisdom"
                  value={themeTitle}
                  onChange={(e) => setThemeTitle(e.target.value)}
                />
              </div>
              <div className="ledger-field">
                <label>Theme Verse</label>
                <input
                  type="text"
                  placeholder="e.g. Psalms 25:4-5"
                  value={themeVerse}
                  onChange={(e) => setThemeVerse(e.target.value)}
                />
              </div>
            </div>
            <div className="ledger-field">
              <label>Announcements</label>
              <textarea
                placeholder="Flower family thank-you, visitor greetings, other notes…"
                value={announcements}
                onChange={(e) => setAnnouncements(e.target.value)}
              />
            </div>
          </div>

          <MonthlyCelebrants celebrants={monthlyCelebrants} month={viewedMonth} />

          {activeReassign === "presider" && (
            <ReassignModal roleLabel="Presider" options={presiderPool} onConfirm={handleConfirm} onClose={closeReassign} />
          )}
          {activeReassign === "speaker" && (
            <ReassignModal roleLabel="Speaker" options={speakerPool} onConfirm={handleConfirm} onClose={closeReassign} />
          )}
          {activeReassign === "specialNumber" && (
            <ReassignModal roleLabel="Special Number" options={specialNumberPool} onConfirm={handleConfirm} onClose={closeReassign} />
          )}
          {activeReassign === "usher" && (
            <ReassignModal roleLabel="Usher" options={usherPool} onConfirm={handleConfirm} onClose={closeReassign} />
          )}
          {activeReassign === "flowerFamily" && (
            <ReassignModal roleLabel="Flower Family" freeText onConfirm={handleConfirm} onClose={closeReassign} />
          )}
        </div>
      </main>
    </div>
  );
}