import { useEffect, useRef, useState } from "react";
import type { RoleAssignment } from "../../types/programLineUp";

interface UpNextPopoverProps {
  upNext: RoleAssignment[];
}

/** Clickable "N Up Next" pill — opens a small popover listing who/what comes
 *  after the currently assigned person, in rotation order. The currently
 *  assigned one is intentionally excluded — this only shows what's ahead. */
export default function UpNextPopover({ upNext }: UpNextPopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  if (upNext.length === 0) return null;

  return (
    <div className="upnext-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`upnext-btn${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        {upNext.length} Up Next
        <i className="fa-solid fa-chevron-down" aria-hidden="true" />
      </button>
      {open && (
        <div className="upnext-pop open">
          <div className="upnext-pop-title">Up next</div>
          <div className="upnext-pop-items">
            {upNext.map((item, i) => (
              <div className="upnext-pop-item" key={item.id}>
                <span className="num">{i + 1}</span> {item.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
