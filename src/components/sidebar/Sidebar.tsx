import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { SidebarItem } from "./SidebarItem";
import { MenuService } from "../../services/menu/MenuService";
import type {
  MenuItem,
  UserAccess,
} from "../../services/menu/interface/IMenuService";
import "./sidebar.css";

// Path assumes: src/components/sidebar/Sidebar.tsx -> src/services/menu/...
// Adjust if your actual folder depth differs.

const menuService = new MenuService();

interface SidebarProps {
  // Pass the logged-in user's resolved access here (role + department
  // names). If omitted, MenuService falls back to "no access yet" and
  // only shows items with no restrictions, to avoid a flash of items
  // the user isn't allowed to see.
  userAccess?: UserAccess;

  // Optional: called whenever the user picks a menu item that has a
  // real path, in addition to the actual navigation. Useful for side
  // effects (closing a mobile drawer, analytics, etc).
  onNavigate?: (path: string) => void;
}

export function Sidebar({ userAccess, onNavigate }: SidebarProps) {
  const menuItems = menuService.getMenuItems(userAccess);

  const navigate = useNavigate();
  const location = useLocation();
  const currentActivePath = location.pathname;

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const go = (path: string) => {
    if (!path) return;
    navigate(path);
    onNavigate?.(path);
  };

  const handleParentClick = (item: MenuItem) => {
    if (item.subMenuItems?.length) {
      setOpenMenu((current) => (current === item.name ? null : item.name));
      return;
    }
    go(item.path);
    setOpenMenu(null);
  };

  const handleChildKeyDown = (e: React.KeyboardEvent, path: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go(path);
    }
  };

 const isParentActive = (item: MenuItem) =>
  (!!item.path && currentActivePath === item.path) ||
  !!item.subMenuItems?.some((child) => child.path === currentActivePath);
  
  return (
    <div className="sidebar-shell">
      <div className="sidebar-header">
        <span className="sidebar-header__brand">UCC</span>
        <span className="sidebar-header__app">App</span>
      </div>

      <ul className="sidebar">
        {menuItems.map((item) => {
          const hasChildren = !!item.subMenuItems?.length;

          return (
            <SidebarItem
              key={item.sortOrder}
              icon={<i className={item.iconClass} />}
              label={item.name}
              active={isParentActive(item) || openMenu === item.name}
              expandable={hasChildren}
              expanded={openMenu === item.name}
              onClick={() => handleParentClick(item)}
              submenu={
                hasChildren ? (
                  <ul className="sidebar-submenu">
                    {item.subMenuItems!.map((child) => (
                      <li
                        key={child.sortOrder}
                        className={`sidebar-subitem ${
                          currentActivePath === child.path
                            ? "sidebar-subitem--active"
                            : ""
                        }`}
                        role="button"
                        tabIndex={0}
                        aria-current={
                          currentActivePath === child.path ? "page" : undefined
                        }
                        onClick={() => go(child.path)}
                        onKeyDown={(e) => handleChildKeyDown(e, child.path)}
                      >
                        <span className="sidebar-subitem__icon">
                          <i className={child.iconClass} />
                        </span>
                        <span className="sidebar-subitem__label">
                          {child.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null
              }
            />
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <button className="sidebar-logout">
          <FontAwesomeIcon icon={faRightFromBracket} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}