import { Link } from "react-router-dom";
import type { DashboardService } from "../../hooks/useDashboard";
import {
  resolveProgramType,
  sundayOccurrenceInMonth,
  type ProgramType,
  type RoleAssignment,
} from "../../types/programLineUp";
import DashboardPanel, { PanelMessage } from "./DashboardPanel";
import { fmtLongDate, LOAD_ERROR_TEXT, relativeDay } from "./dashboardFormat";

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

interface UpcomingServicesCardProps {
  services: DashboardService[] | null; // null while loading
  error: boolean;
  today: Date;
}

function Role({ label, role }: { label: string; role: RoleAssignment | undefined }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{role?.name ? role.name : <span className="dash-unassigned">Not assigned yet</span>}</dd>
    </>
  );
}

function ServiceBlock({ service, today }: { service: DashboardService; today: Date }) {
  const { date, entry } = service;
  const programType = entry?.programType ?? resolveProgramType(date);
  const isSunday = programType !== "prayerMeeting";
  const when = relativeDay(date, today);
  const lineUpPath = `/ProgramLineUp?date=${date}`;

  return (
    <div className="dash-service">
      <div className="dash-service-head">
        <span className="dash-service-date">{fmtLongDate(date)}</span>
        {when && <span className="dash-when">{when}</span>}
        <span className={`badge badge-${programType}`}>
          <i className={PROGRAM_TYPE_ICONS[programType]} aria-hidden="true" />
          {PROGRAM_TYPE_LABELS[programType]}
        </span>
        <Link to={lineUpPath} className="dash-service-action">
          {entry ? "Open line-up" : "Set up line-up"}
        </Link>
      </div>

      {!entry ? (
        <p className="dash-empty dash-empty-tight">No line-up has been saved for this service yet.</p>
      ) : (
        <>
          {(entry.themeTitle || entry.themeVerse) && (
            <p className="dash-service-theme">
              <i className="fa-solid fa-book-bible" aria-hidden="true" />{" "}
              {[entry.themeTitle, entry.themeVerse].filter(Boolean).join(" — ")}
            </p>
          )}
          <dl className="dash-roles">
            <Role label="Presider" role={entry.presider} />
            <Role label="Speaker" role={entry.speaker} />
            {isSunday && (
              <>
                <Role label="Special Number" role={entry.specialNumber} />
                <Role label="Usher" role={entry.usher} />
                <Role label="Flower Family" role={entry.flowerFamily} />
                {sundayOccurrenceInMonth(date) === 2 && (
                  <Role label="Tangkilik" role={{ id: "all", name: "All Council Members" }} />
                )}
              </>
            )}
          </dl>
        </>
      )}
    </div>
  );
}

export default function UpcomingServicesCard({ services, error, today }: UpcomingServicesCardProps) {
  return (
    <DashboardPanel
      icon="fa-solid fa-list-ol"
      title="Upcoming Services"
      link={{ to: "/ProgramLineUpSchedule", label: "View schedule" }}
    >
      {error ? (
        <PanelMessage>{LOAD_ERROR_TEXT}</PanelMessage>
      ) : services === null ? (
        <PanelMessage>Loading…</PanelMessage>
      ) : (
        services.map((s) => <ServiceBlock key={s.date} service={s} today={today} />)
      )}
    </DashboardPanel>
  );
}
