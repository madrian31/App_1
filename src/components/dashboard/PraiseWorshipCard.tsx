import { Fragment } from "react";
import type { DashboardPraiseWorship } from "../../hooks/useDashboard";
import { PW_SLOTS } from "../../types/praiseWorship";
import DashboardPanel, { PanelMessage } from "./DashboardPanel";
import { fmtLongDate, LOAD_ERROR_TEXT, relativeDay } from "./dashboardFormat";

interface PraiseWorshipCardProps {
  praiseWorship: DashboardPraiseWorship | null; // null while loading
  error: boolean;
  today: Date;
}

export default function PraiseWorshipCard({ praiseWorship, error, today }: PraiseWorshipCardProps) {
  const date = praiseWorship?.date;
  const entry = praiseWorship?.entry ?? null;
  const when = date ? relativeDay(date, today) : null;

  // Only the positions someone is on, in the usual order — a full list of
  // sixteen with most of them empty would bury the people who are serving.
  const assigned = entry
    ? PW_SLOTS.map((slot) => ({ slot, people: entry.assignments?.[slot.key] ?? [] })).filter(
        ({ people }) => people.length > 0
      )
    : [];
  const songs = entry?.songs ?? [];

  return (
    <DashboardPanel
      icon="fa-solid fa-music"
      title="Praise & Worship"
      subtitle={date ? `${fmtLongDate(date)}${when ? ` · ${when}` : ""}` : undefined}
      link={
        date ? { to: `/PraiseWorship/LineUp?date=${date}`, label: entry ? "Open line-up" : "Set up line-up" } : undefined
      }
    >
      {error ? (
        <PanelMessage>{LOAD_ERROR_TEXT}</PanelMessage>
      ) : !praiseWorship ? (
        <PanelMessage>Loading…</PanelMessage>
      ) : !entry ? (
        <PanelMessage>No Praise &amp; Worship line-up has been saved for this Sunday yet.</PanelMessage>
      ) : (
        <>
          <h3 className="dash-group-label">Songs</h3>
          {songs.length > 0 ? (
            <ol className="dash-songs">
              {songs.map((song, i) => (
                <li key={`${i}-${song.title}`}>
                  {song.title}
                  {song.artist && <span className="dash-song-artist"> — {song.artist}</span>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="dash-empty dash-empty-tight">No songs added yet.</p>
          )}

          <h3 className="dash-group-label">Assigned</h3>
          {assigned.length > 0 ? (
            <dl className="dash-roles">
              {assigned.map(({ slot, people }) => (
                <Fragment key={slot.key}>
                  <dt>{slot.label}</dt>
                  <dd>{people.map((p) => p.name).join(", ")}</dd>
                </Fragment>
              ))}
            </dl>
          ) : (
            <p className="dash-empty dash-empty-tight">No one assigned yet.</p>
          )}
        </>
      )}
    </DashboardPanel>
  );
}
