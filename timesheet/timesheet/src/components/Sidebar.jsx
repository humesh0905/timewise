import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiUser, FiClock, FiCalendar } from 'react-icons/fi';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => location.pathname === path;
  const initials = user?.name ? user.name.slice(0, 1).toUpperCase() : 'U';

  return (
    <aside className={`app-sidebar${collapsed ? ' is-collapsed' : ''}`}>
      <div className="sidebar-top">
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {collapsed ? <FiMenu /> : <FiX />}
        </button>

        {!collapsed && (
          <div className="sidebar-brand">
            <span>Work hub</span>
            <h2>TimeWise</h2>
          </div>
        )}

        <nav className="sidebar-nav">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
            <li>
              <Link
                to="/timesheets"
                className={`sidebar-link${isActive('/timesheets') ? ' is-active' : ''}`}
              >
                <FiClock />
                {!collapsed && 'Timesheets'}
              </Link>
            </li>

            <li>
              <Link
                to="/admin"
                className={`sidebar-link${isActive('/admin') ? ' is-active' : ''}`}
              >
                <FiUser />
                {!collapsed && 'Admin'}
              </Link>
            </li>

            <li>
              <Link
                to="/profile"
                className={`sidebar-link${isActive('/profile') ? ' is-active' : ''}`}
              >
                <FiUser />
                {!collapsed && 'Profile'}
              </Link>
            </li>

            <li>
              <Link
                to="/reports"
                className={`sidebar-link${isActive('/reports') ? ' is-active' : ''}`}
              >
                <FiClock />
                {!collapsed && 'Reports'}
              </Link>
            </li>

            <li>
              <Link
                to="/calendar"
                className={`sidebar-link${isActive('/calendar') ? ' is-active' : ''}`}
              >
                <FiCalendar />
                {!collapsed && 'Calendar'}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            {user.picture ? (
              <img src={user.picture} alt="Profile" className="sidebar-avatar" />
            ) : (
              <div className="sidebar-avatar-placeholder">{initials}</div>
            )}
            {!collapsed && (
              <div>
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-user-email">{user.email}</div>
              </div>
            )}
          </div>

          <button className="danger-button" onClick={logout} title="Logout">
            {collapsed ? <FiX /> : 'Logout'}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
