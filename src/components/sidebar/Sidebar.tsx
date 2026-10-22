import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faRightFromBracket, faXmark } from "@fortawesome/free-solid-svg-icons";
import { SidebarItem } from "./SidebarItem";
import ChangePasswordModal from "./ChangePasswordModal";
import { MenuService } from "../../services/menu/MenuService";
import { useAuth } from "../../auth/authContext";
import { USER_ROLE_LABELS } from "../../types/auth";
import type {
  MenuItem,
  UserAccess,
} from "../../services/menu/interface/IMenuService";
import "./sidebar.css";

// Path assumes: src/components/sidebar/Sidebar.tsx -> src/services/menu/...
// Adjust if your actual folder depth differs.

const menuService = new MenuService();

interface SidebarProps {
  // Override for the signed-in user's access (role + department names).
  // Normally omitted: the access comes from the signed-in account's role.
  userAccess?: UserAccess;

  // Optional: called whenever the user picks a menu item that has a
  // real path, in addition to the actual navigation. Useful for side
  // effects (closing a mobile drawer, analytics, etc).
  onNavigate?: (path: string) => void;
}

export function Sidebar({ userAccess, onNavigate }: SidebarProps) {
  const { user, signOut } = useAuth();
  const access = userAccess ?? (user ? { role: user.role, departments: [], departmentNames: [] } : undefined);
  const menuItems = menuService.getMenuItems(access);
  const [showChangePassword, setShowChangePassword] = useState(false);

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

  const handleLogout = async () => {
    setDrawerOpen(false);
    await signOut();
    navigate("/login", { replace: true });
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
        {user && (
          <div className="sidebar-user">
            <span className="sidebar-user__avatar" aria-hidden="true">
              {(user.displayName || user.username).slice(0, 1).toUpperCase()}
            </span>
            <span className="sidebar-user__info">
              <span className="sidebar-user__name" title={user.displayName}>
                {user.displayName || user.username}
              </span>
              <span className="sidebar-user__role">{USER_ROLE_LABELS[user.role]}</span>
            </span>
            <button
              type="button"
              className="sidebar-user__action"
              title="Change password"
              aria-label="Change password"
              onClick={() => setShowChangePassword(true)}
            >
              <i className="fa-solid fa-key" aria-hidden="true" />
            </button>
          </div>
        )}
        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          <FontAwesomeIcon icon={faRightFromBracket} />
          <span>Log out</span>
        </button>
      </div>
    </div>

    {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </>
  );
}