import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useTheme } from '../hooks/useTheme';
import './NavBar.css';

interface NavLink {
    icon: string;
    label: string;
    path: string;
}

interface NavBarProps {
    title?: string;
    role: 'admin' | 'teacher' | 'student';
    userName?: string;
    onLogout: () => void;
    backTo?: string;       // optional "Back to Dashboard" link
    backLabel?: string;
    links?: NavLink[];     // optional extra nav links in drawer
}

function NavBar({
    title = 'School Management',
    role,
    userName,
    onLogout,
    backTo,
    backLabel = '← Back to Dashboard',
    links = [],
}: NavBarProps) {
    const [open, setOpen] = useState(false);
    const [theme, toggleTheme] = useTheme();
    const navigate = useNavigate();

    const close = () => setOpen(false);

    const user = authService.getCurrentUser();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    const profilePicUrl = user?.profilePicture 
        ? (user.profilePicture.startsWith('http') ? user.profilePicture : `${API_URL}${user.profilePicture}`)
        : '/default-avatar.png';

    return (
        <>
            <nav className="navbar">
                {/* Left side: back button OR brand */}
                {backTo ? (
                    <button
                        className="navbar-back-btn"
                        onClick={() => navigate(backTo)}
                        aria-label={backLabel}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                ) : (
                    <div className="navbar-brand">
                        <h2>{title}</h2>
                        <span className={`navbar-badge ${role}`}>{role}</span>
                    </div>
                )}

            {/* Theme toggle + Search + Hamburger */}
                <div className="navbar-actions">
                    <div 
                        className="navbar-user" 
                        onClick={() => navigate(`/${role}/profile`)}
                        title="View Profile"
                    >
                        <div className="user-avatar-small">
                            <img src={profilePicUrl} alt={userName} />
                        </div>
                        <span className="navbar-user-name desktop-only">{userName}</span>
                    </div>

                    <div className="navbar-search-compact">
                        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value;
                                    if (val) {
                                        const searchPath = role === 'admin' ? '/admin/search' : '/teacher/search';
                                        navigate(`${searchPath}?q=${val}`);
                                    }
                                }
                            }}
                        />
                    </div>

                    <button
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    
                    <button
                        className={`hamburger-btn${open ? ' open' : ''}`}
                        onClick={() => setOpen(o => !o)}
                        aria-label="Open menu"
                    >
                        <span className="hamburger-line" />
                        <span className="hamburger-line" />
                        <span className="hamburger-line" />
                    </button>
                </div>
            </nav>

            {/* Backdrop */}
            {open && <div className="drawer-overlay" onClick={close} />}

            {/* Drawer */}
            <aside className={`nav-drawer${open ? ' drawer-open' : ''}`}>
                {/* User profile header */}
                <div 
                    className="drawer-header"
                    onClick={() => { close(); navigate(`/${role}/profile`); }}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="drawer-avatar">
                        <img src={profilePicUrl} alt={userName} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="drawer-user-name">{userName || 'User'}</p>
                        <p className="drawer-role-badge">{role}</p>
                    </div>
                </div>

                {/* Back link */}
                {backTo && (
                    <button
                        className="drawer-back-link"
                        onClick={() => { close(); navigate(backTo); }}
                    >
                        <span>←</span>
                        <span>{backLabel}</span>
                    </button>
                )}

                {/* Nav links */}
                {links.length > 0 && (
                    <div className="drawer-links">
                        {links.map(link => (
                            <button
                                key={link.path}
                                className="drawer-link"
                                onClick={() => { close(); navigate(link.path); }}
                            >
                                <span className="drawer-link-icon">{link.icon}</span>
                                <span className="drawer-link-text">{link.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Logout + theme */}
                <div className="drawer-footer">
                    <button
                        className="drawer-theme-btn"
                        onClick={toggleTheme}
                    >
                        <span>{theme === 'light' ? '🌙' : '☀️'}</span>
                        <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                    <button
                        className="drawer-logout-btn"
                        onClick={() => { close(); onLogout(); }}
                    >
                        <span>🚪</span>
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default NavBar;
