import { useState } from "react";
import {
  faUser,
  faLaptop,
  faUserGroup,
  faStar,
  faTrash,
  faList,
  faHandHoldingHeart,
  faBoxArchive,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SidebarItem } from "./SidebarItem";
import "./sidebar.css";

interface NavChild {
  label: string;
  icon: React.ReactNode;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  children?: NavChild[];
}

const items: NavItem[] = [
  { icon: <FontAwesomeIcon icon={faUser} />, label: "My drive" },
  { icon: <FontAwesomeIcon icon={faLaptop} />, label: "Computers" },
  {
    icon: <FontAwesomeIcon icon={faUserGroup} />,
    label: "Members",
    children: [
      { icon: <FontAwesomeIcon icon={faList} />, label: "All members" },
      { icon: <FontAwesomeIcon icon={faHandHoldingHeart} />, label: "Pledgers" },
      { icon: <FontAwesomeIcon icon={faBoxArchive} />, label: "Archives" },
    ],
  },
  { icon: <FontAwesomeIcon icon={faStar} />, label: "Starred" },
  { icon: <FontAwesomeIcon icon={faTrash} />, label: "Trash" },
];

export function Sidebar() {
  const [activeLabel, setActiveLabel] = useState("My drive");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleParentClick = (label: string) => {
    setActiveLabel(label);
    setOpenMenu((current) => (current === label ? null : label));
  };

  const handleChildKeyDown = (e: React.KeyboardEvent, label: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveLabel(label);
    }
  };

  return (
    <div className="sidebar-shell">
      <div className="sidebar-header">
        <span className="sidebar-header__brand">UCC</span>
        <span className="sidebar-header__app">App</span>
      </div>

      <ul className="sidebar">
        {items.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={activeLabel === item.label || openMenu === item.label}
            expandable={!!item.children}
            expanded={openMenu === item.label}
            onClick={() =>
              item.children
                ? handleParentClick(item.label)
                : (setActiveLabel(item.label), setOpenMenu(null))
            }
            submenu={
              item.children ? (
                <ul className="sidebar-submenu">
                  {item.children.map((child) => (
                    <li
                      key={child.label}
                      className={`sidebar-subitem ${
                        activeLabel === child.label ? "sidebar-subitem--active" : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-current={activeLabel === child.label ? "page" : undefined}
                      onClick={() => setActiveLabel(child.label)}
                      onKeyDown={(e) => handleChildKeyDown(e, child.label)}
                    >
                      <span className="sidebar-subitem__icon">{child.icon}</span>
                      <span className="sidebar-subitem__label">{child.label}</span>
                    </li>
                  ))}
                </ul>
              ) : null
            }
          />
        ))}
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