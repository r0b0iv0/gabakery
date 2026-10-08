import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Nav.css';
import { useAuth } from '../auth/AuthContext';
import { canAccessBakerView, canAccessManagerView } from '../auth/permissions';

export function Nav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'management' | 'account' | null>(null);

  const canAccessBaker = canAccessBakerView(user);
  const canAccessManager = canAccessManagerView(user);
  const managerPaths = ['/orders/manage', '/ingredients', '/cakes/new'];
  const managementActive = managerPaths.includes(location.pathname);

  function closeMenus() {
    setMobileOpen(false);
    setOpenMenu(null);
  }

  function toggleMenu(menu: 'management' | 'account') {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        closeMenus();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMenus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function handleLogout() {
    closeMenus();
    void logout();
  }

  return (
    <header className="nav" ref={navRef}>
      <div className="nav-top-row">
        <NavLink to="/" end className="nav-brand" onClick={closeMenus}>
          🎂 GaBakery
        </NavLink>

        <button
          type="button"
          className="nav-mobile-toggle"
          aria-label={mobileOpen ? 'Затвори менюто' : 'Отвори менюто'}
          aria-expanded={mobileOpen}
          aria-controls="main-navigation"
          onClick={() => {
            setMobileOpen((open) => !open);
            setOpenMenu(null);
          }}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav
        id="main-navigation"
        className={`nav-links${mobileOpen ? ' is-open' : ''}`}
        aria-label="Основна навигация"
      >
        <NavLink
          to="/order"
          className={({ isActive }) => (isActive ? 'active' : '')}
          onClick={closeMenus}
        >
          Поръчай торта
        </NavLink>

        {canAccessBaker && (
          <NavLink
            to="/baker"
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={closeMenus}
          >
            Пекарна
          </NavLink>
        )}

        {canAccessManager && (
          <div className="nav-menu">
            <button
              type="button"
              className={`nav-menu-trigger${managementActive ? ' active' : ''}`}
              aria-expanded={openMenu === 'management'}
              aria-controls="management-menu"
              onClick={() => toggleMenu('management')}
            >
              Управление <span className="nav-chevron" aria-hidden="true">▾</span>
            </button>

            <div
              className="nav-dropdown"
              id="management-menu"
              hidden={openMenu !== 'management'}
            >
              <NavLink to="/orders/manage" onClick={closeMenus}>
                Поръчки
              </NavLink>
              <NavLink to="/ingredients" onClick={closeMenus}>
                Съставки
              </NavLink>
              <NavLink to="/cakes/new" onClick={closeMenus}>
                Нова торта
              </NavLink>
            </div>
          </div>
        )}

        {user ? (
          <div className="nav-menu nav-account-menu">
            <button
              type="button"
              className="nav-menu-trigger nav-account-trigger"
              aria-expanded={openMenu === 'account'}
              aria-controls="account-menu"
              onClick={() => toggleMenu('account')}
            >
              {user.name || user.email}
              <span className="nav-chevron" aria-hidden="true">▾</span>
            </button>

            <div
              className="nav-dropdown nav-account-dropdown"
              id="account-menu"
              hidden={openMenu !== 'account'}
            >
              <button
                type="button"
                className="nav-dropdown-action"
                onClick={handleLogout}
              >
                Изход
              </button>
            </div>
          </div>
        ) : (
          <div className="nav-auth-links">
            <NavLink
              to="/login"
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={closeMenus}
            >
              Вход
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={closeMenus}
            >
              Регистрация
            </NavLink>
          </div>
        )}
      </nav>
    </header>
  );
}
