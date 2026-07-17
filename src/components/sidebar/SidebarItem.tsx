import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onClick?: () => void;
  submenu?: ReactNode;
}

export function SidebarItem({
  icon,
  label,
  active,
  expandable,
  expanded,
  onClick,
  submenu,
}: SidebarItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <li
      className={`sidebar-item ${active ? "sidebar-item--active" : ""} ${
        expandable && expanded ? "sidebar-item--expanded" : ""
      }`}
      role="button"
      tabIndex={0}
      aria-current={active && !expandable ? "page" : undefined}
      aria-expanded={expandable ? expanded : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="sidebar-item__row">
        <span className="sidebar-item__icon">{icon}</span>
        <span className="sidebar-item__label">{label}</span>
        {expandable && (
          <span
            className={`sidebar-item__chevron ${
              expanded ? "sidebar-item__chevron--open" : ""
            }`}
          >
            <FontAwesomeIcon icon={faChevronDown} />
          </span>
        )}
      </div>
      {expandable && (
        <div
          className={`sidebar-submenu-wrapper ${
            expanded ? "sidebar-submenu-wrapper--open" : ""
          }`}
        >
          <div className="sidebar-submenu-inner">{submenu}</div>
        </div>
      )}
    </li>
  );
}