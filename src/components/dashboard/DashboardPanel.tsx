import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface DashboardPanelProps {
  icon: string; // Font Awesome class
  title: string;
  subtitle?: string;
  link?: { to: string; label: string };
  children: ReactNode;
}

/** White card with a titled header and an optional "View all" link — the frame for every dashboard section. */
export default function DashboardPanel({ icon, title, subtitle, link, children }: DashboardPanelProps) {
  return (
    <section className="dash-panel">
      <header className="dash-panel-header">
        <div>
          <h2 className="dash-panel-title">
            <i className={icon} aria-hidden="true" />
            {title}
          </h2>
          {subtitle && <p className="dash-panel-subtitle">{subtitle}</p>}
        </div>
        {link && (
          <Link to={link.to} className="dash-panel-link">
            {link.label} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        )}
      </header>
      <div className="dash-panel-body">{children}</div>
    </section>
  );
}

/** Loading / error / empty message shown inside a panel. */
export function PanelMessage({ children }: { children: ReactNode }) {
  return <p className="dash-empty">{children}</p>;
}
