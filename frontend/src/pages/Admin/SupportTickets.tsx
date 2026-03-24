import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportService, authService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './SupportTickets.css';

const CATEGORY_LABELS: Record<string, string> = {
    password_issue: '🔑 Password Issue',
    bug: '🐛 Bug / Error',
    other: '💬 Other',
};

export default function SupportTickets() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const load = async () => {
        try {
            const data = await supportService.getAll();
            setTickets(data);
        } catch (e) {
            console.error(e);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleResolve = async (id: string) => {
        setResolvingId(id);
        try {
            await supportService.resolve(id, adminNotes[id] || '');
            await load();
            setExpandedId(null);
        } finally { setResolvingId(null); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this ticket?')) return;
        await supportService.remove(id);
        await load();
    };

    const filtered = tickets.filter(t => filter === 'all' ? true : t.status === filter);
    const openCount = tickets.filter(t => t.status === 'open').length;

    if (loading) return <div className="st-page"><div className="st-loading">Loading tickets...</div></div>;

    return (
        <div className="dashboard-container">
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/dashboard" backLabel="Dashboard" />
            
            <div className="st-page">
                <div className="st-header">
                <div>
                    <h1>🛠️ Support Tickets</h1>
                    <p>{openCount > 0 ? `${openCount} open issue${openCount !== 1 ? 's' : ''} need attention` : 'All caught up! No open issues.'}</p>
                </div>
            </div>

            <div className="st-filters">
                {(['all', 'open', 'resolved'] as const).map(f => (
                    <button
                        key={f}
                        className={`st-filter-btn${filter === f ? ' active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? `All (${tickets.length})` : f === 'open' ? `Open (${openCount})` : `Resolved (${tickets.length - openCount})`}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="st-empty">No {filter === 'all' ? '' : filter} tickets yet.</div>
            ) : (
                <div className="st-list">
                    {filtered.map(ticket => (
                        <div key={ticket._id} className={`st-card${ticket.status === 'resolved' ? ' resolved' : ''}`}>
                            <div className="st-card-head" onClick={() => setExpandedId(expandedId === ticket._id ? null : ticket._id)}>
                                <div className="st-meta">
                                    <span className={`st-badge st-badge-${ticket.status}`}>
                                        {ticket.status === 'open' ? '🔴 Open' : '✅ Resolved'}
                                    </span>
                                    <span className="st-category">{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
                                </div>
                                <h3 className="st-title">{ticket.title}</h3>
                                <div className="st-submitter">
                                    Submitted by <strong>{ticket.submitterName}</strong>
                                    <span className={`st-role ${ticket.role}`}>{ticket.role}</span>
                                    · {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                                </div>
                            </div>

                            {expandedId === ticket._id && (
                                <div className="st-expanded">
                                    <p className="st-description">{ticket.description}</p>
                                    {ticket.screenshot && (
                                        <img src={ticket.screenshot} alt="screenshot" className="st-screenshot" />
                                    )}
                                    {ticket.adminNotes && (
                                        <div className="st-admin-notes">
                                            <strong>Admin notes:</strong> {ticket.adminNotes}
                                        </div>
                                    )}
                                    {ticket.status === 'open' && (
                                        <div className="st-actions">
                                            <textarea
                                                className="st-notes-input"
                                                placeholder="Optional notes (e.g., 'Reset your password and try again')"
                                                value={adminNotes[ticket._id] || ''}
                                                onChange={e => setAdminNotes(n => ({ ...n, [ticket._id]: e.target.value }))}
                                                rows={2}
                                            />
                                            <button
                                                className="st-resolve-btn"
                                                onClick={() => handleResolve(ticket._id)}
                                                disabled={resolvingId === ticket._id}
                                            >
                                                {resolvingId === ticket._id ? 'Resolving...' : '✅ Mark Resolved'}
                                            </button>
                                        </div>
                                    )}
                                    <button className="st-delete-btn" onClick={() => handleDelete(ticket._id)}>🗑 Delete</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
    );
}
