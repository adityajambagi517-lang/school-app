import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, searchService } from '../services/api';
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
    backTo?: string;
    backLabel?: string;
    links?: NavLink[];
}

type SearchResult = { _id: string; name: string; type: 'student' | 'teacher' | 'class'; subtitle: string; refId: string };

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

    // Search state
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const close = () => setOpen(false);

    const user = authService.getCurrentUser();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const profilePicUrl = user?.profilePicture
        ? (user.profilePicture.startsWith('http') || user.profilePicture.startsWith('data:') ? user.profilePicture : `${API_URL}${user.profilePicture}`)
        : '/default-avatar.png';

    // Debounced search
    const doSearch = useCallback(async (q: string) => {
        if (!q.trim() || q.length < 2) { setResults([]); setShowDropdown(false); return; }
        setSearching(true);
        try {
            const data = await searchService.unified(q);
            setResults(data);
            setShowDropdown(true);
            setActiveIndex(-1);
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(query), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, doSearch]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (result: any) => {
        setQuery('');
        setShowDropdown(false);
        if (result.type === 'class') {
            navigate('/admin/classes');
        } else {
            navigate(`/admin/${result.type}s/${result.refId}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown || results.length === 0) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)); }
        else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); handleSelect(results[activeIndex]); }
        else if (e.key === 'Escape') { setShowDropdown(false); setQuery(''); }
    };

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

                    {/* Live Search — admin only */}
                    {role === 'admin' && (
                        <div className="navbar-search-compact" ref={searchRef}>
                            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search students & teachers..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                                autoComplete="off"
                            />
                            {/* Dropdown */}
                            {showDropdown && (
                                <div className="search-dropdown">
                                    {searching && <div className="search-dropdown-loading">Searching...</div>}
                                    {!searching && results.length === 0 && query.length >= 2 && (
                                        <div className="search-dropdown-empty">No results for "{query}"</div>
                                    )}
                                    {!searching && results.map((r, i) => (
                                        <div
                                            key={r._id}
                                            className={`search-dropdown-item${i === activeIndex ? ' active' : ''}`}
                                            onMouseDown={() => handleSelect(r)}
                                            onMouseEnter={() => setActiveIndex(i)}
                                        >
                                            <span className={`search-type-badge search-type-${r.type}`}>
                                                {r.type === 'student' ? '🎓' : r.type === 'teacher' ? '👨‍🏫' : '🏫'}
                                            </span>
                                            <div className="search-item-info">
                                                <span className="search-item-name">{r.name}</span>
                                                <span className="search-item-sub">{r.subtitle}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

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

