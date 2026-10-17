import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faRightFromBracket, faXmark } from "@fortawesome/free-solid-svg-icons";
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

  // Mobile only: whether the off-canvas drawer is showing. On desktop the
  // sidebar is always visible and this flag has no effect.
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [currentActivePath]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("sidebar-drawer-lock");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("sidebar-drawer-lock");
    };
  }, [drawerOpen]);

  const go = (path: string) => {
    if (!path) return;
    navigate(path);
    setDrawerOpen(false);
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

  // Routes match case-insensitively, so compare paths the same way. A path
  // also counts as a match for its sub-routes (e.g. /SundaySchoolAttendance
  // for /SundaySchoolAttendance/attendance).
  const current = currentActivePath.toLowerCase();
  const matchesPath = (path: string) => {
    if (!path) return false;
    const p = path.toLowerCase();
    return current === p || current.startsWith(p + "/");
  };

  // Of a group's children, only the most specific match is active, so
  // /Visitation/Reports highlights "Visitation Report" but not "All Visitations".
  const activeChildPath = (item: MenuItem) =>
    item.subMenuItems
      ?.filter((child) => matchesPath(child.path))
      .sort((a, b) => b.path.length - a.path.length)[0]?.path;

  const isParentActive = (item: MenuItem) =>
    matchesPath(item.path) || !!activeChildPath(item);
  
  return (
    <>
    <div className="sidebar-topbar">
      <button
        type="button"
        className="sidebar-topbar__toggle"
        aria-label="Open menu"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen(true)}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>
      <span className="sidebar-header__brand">LINK</span>
      <span className="sidebar-header__app">Up</span>
    </div>

    <div
      className={`sidebar-backdrop ${drawerOpen ? "sidebar-backdrop--open" : ""}`}
      onClick={() => setDrawerOpen(false)}
      aria-hidden="true"
    />

    <div className={`sidebar-shell ${drawerOpen ? "sidebar-shell--open" : ""}`}>
      <div className="sidebar-header">
        <button
          type="button"
          className="sidebar-header__close"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
        <span className="sidebar-header__brand">LINK</span>
        <span className="sidebar-header__app">Up</span>
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
                    {item.subMenuItems!.map((child) => {
                      const childActive = child.path === activeChildPath(item);
                      return (
                      <li
                        key={child.sortOrder}
                        className={`sidebar-subitem ${
                          childActive
                            ? "sidebar-subitem--active"
                            : ""
                        }`}
                        role="button"
                        tabIndex={0}
                        aria-current={
                          childActive ? "page" : undefined
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
                      );
                    })}
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
    </>
  );
}