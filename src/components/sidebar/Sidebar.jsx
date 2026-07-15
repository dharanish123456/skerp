import { useState, useEffect } from 'react';
import './Sidebar.css';

const menuSections = [
  {
    title: "Main Menu",
    items: [
      {
        title: "Dashboard",
        icon: "ri:dashboard-line",
        submenu: [
          { label: "Overview", href: "#", page: "dashboard-overview" },
          { label: "Analytics", href: "#", page: "dashboard-analytics" },
        ],
      },
      {
        title: "Expenses",
        icon: "ri:wallet-3-line",
        submenu: [
          { label: "Daily Expenses", href: "#", page: "expenses-daily" },
          { label: "Employee Advance", href: "#", page: "employee-advance" },
        ],
      },
    ],
  },
  {
    title: "HR Management",
    items: [
      {
        title: "Employee",
        icon: "ri:group-line",
        submenu: [
          { label: "Employee List", href: "#", page: "employee-list" },
         
        ],
      },
      {
        title: "Company",
        icon: "ri:building-line", // Changed to a department-appropriate building icon
        page: "company",      // Put the page target directly here
        href: "#",
      },
      {
        title: "Department",
        icon: "ri:git-branch-line",
        page: "departments",
        href: "#",
      },
    ],
  },
];

const buildOpenKey = (sectionIndex, itemIndex) =>
  `${sectionIndex}-${itemIndex}`;

const Sidebar = ({
  isCollapsed = false,
  isMobileOpen = false,
  onMobileClose,
  onToggle,
  currentPage = "employee-list",
  onPageChange,
}) => {
  const [openKey, setOpenKey] = useState(null);

  // Sync collapsed state with main content wrapper
  useEffect(() => {
    const mainWrapper = document.getElementById('dashboard-main');
    if (mainWrapper) {
      if (isCollapsed) {
        mainWrapper.classList.add('active');
      } else {
        mainWrapper.classList.remove('active');
      }
    }
  }, [isCollapsed]);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200) {
        onMobileClose && onMobileClose();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onMobileClose]);

  useEffect(() => {
    const activeParentKey = menuSections
      .flatMap((section, sectionIndex) =>
        section.items.map((item, itemIndex) => ({
          key: buildOpenKey(sectionIndex, itemIndex),
          pages: Array.isArray(item.submenu)
            ? item.submenu.map((sub) => sub.page).filter(Boolean)
            : [],
        }))
      )
      .find((entry) => entry.pages.includes(currentPage))?.key;

    setOpenKey(activeParentKey ?? null);
  }, [currentPage]);

  const toggleCollapse = () => onToggle && onToggle();

  const handleDropdownToggle = (key) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  const handleNavClick = (e, page) => {
    e.preventDefault();
    if (onPageChange) onPageChange(page);
    if (window.innerWidth < 1200) onMobileClose && onMobileClose();
  };

  // Position flyout vertically based on hovered li
  const handleMenuItemMouseEnter = (e, subCount) => {
    const li = e.currentTarget;
    const rect = li.getBoundingClientRect();
    const flyout = li.querySelector('.sidebar-flyout');
    if (!flyout) return;
    const flyoutHeight = Math.min(subCount * 40 + 60, window.innerHeight - 24);
    const maxHeight = window.innerHeight - rect.top - 12;
    flyout.style.setProperty('--flyout-top', `${rect.top}px`);
    flyout.style.setProperty('--flyout-max-height', `${Math.min(flyoutHeight, maxHeight)}px`);
  };

  return (
    <>
      <aside
        className={[
          'sidebar',
          isMobileOpen ? 'sidebar-open' : '',
          isCollapsed ? 'active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Close button (mobile only) */}
        <button className="sidebar-close-btn" onClick={onMobileClose}>
          <iconify-icon icon="ri:close-line"></iconify-icon>
        </button>

        {/* Logo row */}
        <div className="sidebar-logo">
          <div className="sidebar-logo__brand">
            <img src="/logo.png" alt="Logo" className="logo-icon" />
            <span className="light-logo">MyERP</span>
          </div>
          <button className="sidebar-collapse-btn" onClick={toggleCollapse}>
            <iconify-icon
              icon={isCollapsed ? 'ri:arrow-right-s-line' : 'ri:arrow-left-s-line'}
            ></iconify-icon>
          </button>
        </div>

        {/* Menu area */}
        <div className="sidebar-menu-area">
          <ul className="sidebar-menu" id="sidebar-menu">
            {menuSections.map((section, sectionIndex) => (
              <li key={sectionIndex} style={{ listStyle: 'none' }}>
                {/* Section group title */}
                {section.title && (
                  <span
                    className={`sidebar-menu-group-title${isCollapsed ? ' hidden' : ''}`}
                  >
                    {section.title}
                  </span>
                )}

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {section.items.map((item, itemIndex) => {
                    const hasSubmenu =
                      Array.isArray(item.submenu) && item.submenu.length > 0;
                    const filteredSubs = hasSubmenu ? item.submenu : [];
                    const key = buildOpenKey(sectionIndex, itemIndex);
                    const isOpenDropdown = hasSubmenu && openKey === key;
                    const isSubmenuActive = filteredSubs.some(
                      (sub) => sub.page === currentPage
                    );
                    const isItemActive = item.page === currentPage || isSubmenuActive;

                    return (
                      <li
                        key={itemIndex}
                        className={[
                          hasSubmenu ? 'dropdown' : '',
                          (isOpenDropdown || isSubmenuActive) ? 'open' : '',
                          isSubmenuActive ? 'active-parent' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onMouseEnter={
                          isCollapsed
                            ? (e) => handleMenuItemMouseEnter(e, filteredSubs.length)
                            : undefined
                        }
                      >
                        <a
                          href={item.href || '#'}
                          className={isItemActive ? 'active-page' : ''}
                          onClick={(e) => {
                            e.preventDefault();
                            if (hasSubmenu) {
                              if (!isCollapsed) handleDropdownToggle(key);
                            } else if (item.page) {
                              handleNavClick(e, item.page);
                            }
                          }}
                        >
                          <iconify-icon
                            icon={item.icon}
                            className="menu-icon"
                          ></iconify-icon>
                          <span>{item.title}</span>
                          {hasSubmenu && (
                            <iconify-icon
                              icon="ri:arrow-down-s-line"
                              className="sidebar-menu__arrow"
                            ></iconify-icon>
                          )}
                        </a>

                        {/* Submenu (expanded mode) */}
                        {hasSubmenu && (
                          <ul className="sidebar-submenu">
                            {filteredSubs.map((sub, subIndex) => (
                              <li key={subIndex}>
                                <a
                                  href={sub.href || '#'}
                                  className={
                                    sub.page && sub.page === currentPage
                                      ? 'active-page'
                                      : ''
                                  }
                                  onClick={(e) => {
                                    if (sub.page) handleNavClick(e, sub.page);
                                  }}
                                >
                                  <span>{sub.label}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Flyout (collapsed mode) */}
                        {isCollapsed && (
                          <div
                            className={`sidebar-flyout${!hasSubmenu ? ' flyout-leaf' : ''}`}
                          >
                            {hasSubmenu ? (
                              <span className="flyout-title flyout-title-highlight">
                                {item.title}
                              </span>
                            ) : (
                              <a
                                href={item.href || '#'}
                                className={`flyout-title flyout-title-clickable${
                                  item.page && item.page === currentPage
                                    ? ' active-page'
                                    : ''
                                }`}
                                onClick={(e) => {
                                  if (item.page) handleNavClick(e, item.page);
                                }}
                              >
                                {item.title}
                              </a>
                            )}
                            {filteredSubs.map((sub, subIndex) => (
                              <a
                                key={subIndex}
                                href={sub.href || '#'}
                                className={`flyout-link${
                                  sub.page && sub.page === currentPage
                                    ? ' active-page'
                                    : ''
                                }`}
                                onClick={(e) => {
                                  if (sub.page) handleNavClick(e, sub.page);
                                }}
                              >
                                {sub.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>

      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose}></div>
      )}
    </>
  );
};

export default Sidebar;
