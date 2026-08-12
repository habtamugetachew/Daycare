import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useLanguage } from '../context/useLanguage';
import {
  LayoutDashboard,
  UserCheck,
  ClipboardCheck,
  Baby,
  Users,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { collapsed, mobileOpen, toggle } = useSidebar();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return null;

  const isCollapsed = !isMobile && collapsed;
  const translateX = isMobile && !mobileOpen ? '-100%' : '0';

  const toggleSubmenu = (menuTitle) => {
    if (isCollapsed) return;
    setOpenMenu((prev) => (prev === menuTitle ? null : menuTitle));
  };

  const getPortalLabel = (role) => {
    switch (role) {
      case 'admin': return t('adminPortal');
      case 'parent': return t('parentPortal');
      case 'teacher': return t('teacherPortal');
      case 'reception': return t('receptionPortal');
      case 'staff': return t('staffPortal');
      default: return t('daycare');
    }
  };

  const portalLabel = getPortalLabel(user.role);

  const navigationConfig = [
    { titleKey: 'dashboard', icon: LayoutDashboard, path: `/dashboard/${user.role}`, roles: ['admin', 'parent', 'teacher', 'reception', 'staff'] },
    { titleKey: 'children', icon: Baby, path: `/dashboard/${user.role}/view-child`, roles: ['admin'] },
    { titleKey: 'parents', icon: ShieldCheck, path: `/dashboard/${user.role}/view-parent`, roles: ['admin'] },
    { titleKey: 'enrollmentApprovals', icon: ClipboardCheck, path: '/dashboard/admin/approvals', roles: ['admin'] },
    { titleKey: 'staffManagement', icon: ClipboardCheck, roles: ['admin'], subItems: [
      { labelKey: 'addStaff', icon: ClipboardCheck, path: `/dashboard/admin/add-staff` },
      { labelKey: 'viewStaff', icon: ClipboardCheck, path: `/dashboard/admin/view-staff` },
      { labelKey: 'assign', icon: ClipboardCheck, path: `/dashboard/admin/assign` }
    ]},
    { titleKey: 'classroom', icon: Users, roles: ['teacher'], subItems: [
      { labelKey: 'assignedRoom', icon: Users }, { labelKey: 'studentList', icon: Users },
      { labelKey: 'capacity', icon: Users }
    ]},
    { titleKey: 'attendance', icon: CalendarCheck, path: `/dashboard/${user.role}/attendance`, roles: ['teacher', 'admin'] },
    { titleKey: 'myChildren', icon: Baby, roles: ['parent'], subItems: [
      { labelKey: 'registerChild', icon: Baby, path: '/dashboard/parent/register-child' },
      { labelKey: 'childProfile', icon: Baby, path: '/dashboard/parent/profile-card' },
    ]},
    { titleKey: 'registrationUpdates', icon: ClipboardCheck, path: '/dashboard/parent/registration-updates', roles: ['parent'] },
    { titleKey: 'payments', icon: CreditCard, path: `/dashboard/${user.role}/payments`, roles: ['parent', 'staff', 'admin'] },
    { titleKey: 'dailyReports', icon: ClipboardCheck, path: `/dashboard/${user.role}/daily-reports`, roles: ['teacher', 'parent'], subItems: [
      { labelKey: 'mealsIntake', icon: ClipboardCheck }, { labelKey: 'activitiesLog', icon: ClipboardCheck },
      { labelKey: 'sleepNaps', icon: ClipboardCheck }, { labelKey: 'vaccinationLog', icon: ClipboardCheck }
    ]},
    { titleKey: 'registration', icon: UserCheck, roles: ['reception'], subItems: [
      { labelKey: 'newRegister', icon: ClipboardCheck, path: '/dashboard/reception/new-child-registry' },
      { labelKey: 'updateInfo', icon: ClipboardCheck, path: '/dashboard/reception/update-info' },
      { labelKey: 'childIdGenerate', icon: ClipboardCheck, path: '/dashboard/reception/child-id-generate' }
    ]},
    { titleKey: 'providerAttendance', icon: CalendarCheck, path: '/dashboard/reception/teacher-attendance', roles: ['reception'] },
    { titleKey: 'childAttendance', icon: Baby, path: '/dashboard/reception/child-attendance', roles: ['reception'] },
    { titleKey: 'registrationUpdates', icon: ClipboardCheck, path: '/dashboard/reception/registration-updates', roles: ['reception'] },
    { titleKey: 'assignedDuties', icon: ClipboardCheck, roles: ['staff'], subItems: [
      { labelKey: 'viewTasks', icon: ClipboardCheck }, { labelKey: 'dailyChecklist', icon: ClipboardCheck }
    ]},
    { titleKey: 'mealsPrep', icon: ClipboardCheck, roles: ['staff'], subItems: [
      { labelKey: 'mealPreparation', icon: ClipboardCheck }, { labelKey: 'dietaryRequirements', icon: ClipboardCheck }
    ]},
    { titleKey: 'transportation', icon: ClipboardCheck, roles: ['staff'], subItems: [
      { labelKey: 'pickupLog', icon: ClipboardCheck }, { labelKey: 'dropOffLog', icon: ClipboardCheck }
    ]},
    { titleKey: 'communication', icon: ShieldCheck, path: `/dashboard/${user.role}/communication`, roles: ['admin', 'teacher', 'parent', 'reception'] },
  ];

  const filteredMenu = navigationConfig.filter(item => item.roles.includes(user.role));
  const getLabel = (item) => item.titleKey ? t(item.titleKey) : item.title;
  const getSubLabel = (sub) => sub.labelKey ? t(sub.labelKey) : sub.label;
  const getSlug = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const getSubPath = (sub) => sub.path || `/dashboard/${user.role}/${getSlug(sub.labelKey ? sub.labelKey : sub.label)}`;

  useEffect(() => {
    const activeParent = filteredMenu.find((item) =>
      item.subItems?.some((sub) => {
        const subPath = getSubPath(sub);
        return location.pathname === subPath || location.pathname.startsWith(subPath);
      })
    );

    if (activeParent) {
      setOpenMenu(activeParent.title || activeParent.titleKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      <aside
        className="sidebar"
        style={{
          width: isCollapsed ? '72px' : '270px',
          transform: `translateX(${translateX})`,
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          zIndex: 100,
        }}
      >
        <button
          onClick={toggle}
          className="absolute top-3 right-3 z-[10] w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="text-lg" />
        </button>

        <div
          className="brand"
          style={{
            paddingLeft: isCollapsed ? '10px' : '14px',
            paddingRight: isCollapsed ? '10px' : '44px',
          }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            borderRadius: '16px',
            padding: isCollapsed ? '6px' : '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.28), 0 1px 4px rgba(0,0,0,0.18)',
            flexShrink: 0,
          }}>
            <img
              src="/assets/images/mint-logo.png"
              alt="Daycare Logo"
              style={{
                height: isCollapsed ? '32px' : '44px',
                width: isCollapsed ? '32px' : '44px',
                objectFit: 'contain',
                display: 'block',
                borderRadius: '8px',
              }}
            />
          </div>
          {!isCollapsed && (
            <div style={{ marginLeft: '10px', lineHeight: 1.2 }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>{t('daycare')}</p>
              <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.60)', whiteSpace: 'nowrap', marginTop: '2px' }}>{portalLabel}</p>
            </div>
          )}
        </div>

        <div className="nav-menu-container flex-1 min-h-0 pt-4">
          <ul className="nav-menu space-y-1">
            {filteredMenu.map(item => {
              const hasSub = item.subItems && item.subItems.length > 0;
              const label = getLabel(item);
              const isChildActive = hasSub && item.subItems.some((sub) => {
                const subPath = getSubPath(sub);
                return location.pathname === subPath || location.pathname.startsWith(subPath);
              });
              const isOpen = openMenu === item.title || openMenu === item.titleKey || isChildActive;

              return (
                <li key={label} className={`nav-item ${hasSub ? 'has-sub' : ''} ${isOpen ? 'open' : ''} ${isChildActive ? 'active' : ''}`}>
                  {hasSub ? (
                    <button
                      onClick={() => {
                        toggleSubmenu(item.title || item.titleKey);
                        if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      className={`nav-link w-full text-left flex items-center justify-between px-3 py-2 rounded-2xl transition-all ${isChildActive || (item.path && location.pathname.includes(item.path)) ? 'bg-slate-900/5 text-slate-900 dark:bg-white/5 dark:text-white' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/10'}`}
                      title={isCollapsed ? label : ''}
                    >
                      <div className="nav-link-left flex items-center gap-3">
                        <item.icon className="text-lg" />
                        {!isCollapsed && <span className="ml-2.5 whitespace-nowrap text-sm font-medium">{label}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown className={`text-base transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => `nav-link w-full text-left flex items-center px-3 py-2 rounded-2xl transition-all ${isActive ? 'bg-slate-900/5 text-slate-900 dark:bg-white/5 dark:text-white' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/10'}`}
                      title={isCollapsed ? label : ''}
                    >
                      <div className="nav-link-left flex items-center gap-3">
                        <item.icon className="text-lg" />
                        {!isCollapsed && <span className="ml-2.5 whitespace-nowrap text-sm font-medium">{label}</span>}
                      </div>
                    </NavLink>
                  )}

                  {hasSub && isOpen && !isCollapsed && (
                    <ul className="sub-menu mt-2 space-y-2 pl-2">
                      {item.subItems.map((sub, idx) => (
                        <li key={`${label}-${idx}`}>
                          <NavLink
                            to={getSubPath(sub)}
                            className={({ isActive }) => isActive ? 'active' : ''}
                          >
                            <i className={`bx ${sub.icon} text-base`} />
                            <span className="text-sm">{getSubLabel(sub)}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="sidebar-footer px-3 py-4">
          <button
            onClick={logout}
            className="sidebar-signout-button w-full flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
            title={isCollapsed ? t('signOut') : ''}
          >
            <div className="flex items-center gap-3">
              <span
                className="sidebar-signout-icon flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)' }}
              >
                <i className="bx bx-log-out text-xl" />
              </span>
              {!isCollapsed && <span>{t('signOut')}</span>}
            </div>
            {!isCollapsed && <ChevronLeft className="text-base text-white/80" />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
