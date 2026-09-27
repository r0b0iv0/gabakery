import { NavLink } from 'react-router-dom';
import './Nav.css';
import { useAuth } from '../auth/AuthContext';
import { canAccessBakerView, canAccessManagerView } from '../auth/permissions';


export function Nav() {

  const { user, logout } = useAuth();

  const canAccessBaker = canAccessBakerView(user);
  const canAcessManagerView = canAccessManagerView(user);

  return (
    <header className="nav">
      <NavLink to="/" end className="nav-brand">
        🎂 GaBakery
      </NavLink>
      <nav className="nav-links">
        <NavLink to="/order" className={({ isActive }) => (isActive ? 'active' : '')}>
          Поръчай торта
        </NavLink>
        {canAccessBaker && (
          <NavLink to="/baker" className={({ isActive }) => (isActive ? 'active' : '')}>
            Изглед за пекари
          </NavLink>
        )}
        {canAcessManagerView && (
          <NavLink
            to="/cakes/new"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Нова торта
          </NavLink>
        )}
        <span className="nav-separator" />
        {user ? (
          <>
            <span className="nav-user">
              {user.name || user.email}
            </span>

            <button
              type="button"
              className="secondary"
              onClick={logout}
            >
              Изход
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Вход
            </NavLink>

            <NavLink
              to="/register"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Регистрация
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
