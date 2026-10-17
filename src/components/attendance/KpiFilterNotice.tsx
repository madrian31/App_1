import { useEffect, useState } from "react";

export interface KpiNotice {
  /** Changes on every click so the same message can re-trigger the notice. */
  id: number;
  icon: string;
  title: string;
  detail: string;
}

interface KpiFilterNoticeProps {
  notice: KpiNotice | null;
  durationMs?: number;
}

/** Brief center-screen confirmation shown after clicking a KPI card. */
export default function KpiFilterNotice({ notice, durationMs = 2500 }: KpiFilterNoticeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!notice) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(timer);
  }, [notice, durationMs]);

  if (!notice) return null;

  return (
    <div className={`kpi-notice${visible ? " show" : ""}`} role="status" aria-live="polite">
      <i className={notice.icon} aria-hidden="true" />
      <div>
        <p className="kpi-notice-title">{notice.title}</p>
        <p className="kpi-notice-detail">{notice.detail}</p>
      </div>
    </div>
  );
}
