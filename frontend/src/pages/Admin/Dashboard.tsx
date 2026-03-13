import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, GraduationCap, School, BarChart3,
    UserPlus, BookUser, CheckSquare, DollarSign, Search, Megaphone, ShieldCheck
} from 'lucide-react';
import { authService, approvalsService } from '../../services/api';
import api from '../../services/api';
import NavBar from '../../components/NavBar';
import './Dashboard.css';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function AdminDashboard() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [stats, setStats] = useState<any>(null);
    const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardStats();
        loadPendingApprovalsCount();
    }, []);

    const loadPendingApprovalsCount = async () => {
        try {
            const data = await approvalsService.getPending();
            setPendingApprovalsCount(data.length);
        } catch { /* silent */ }
    };

    const loadDashboardStats = async () => {
        try {
            const res = await api.get('/analytics/dashboard');
            setStats(res.data);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const actions = [
        { icon: <UserPlus size={22} color="white" />, label: 'Add Student', path: '/admin/register-student', style: 't-indigo' },
        { icon: <BookUser size={22} color="white" />, label: 'Add Teacher', path: '/admin/register-teacher', style: 't-green' },
        { icon: <Users size={22} color="white" />, label: 'Teachers', path: '/admin/teachers', style: 't-teal' },
        { icon: <School size={22} color="white" />, label: 'Classes', path: '/admin/classes', style: 't-orange' },
        { icon: <CheckSquare size={22} color="white" />, label: 'Approvals', path: '/admin/approvals', style: 't-red', badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined },
        { icon: <Search size={22} color="white" />, label: 'Search', path: '/admin/search', style: 't-blue' },
        { icon: <Megaphone size={22} color="white" />, label: 'Notices', path: '/admin/notices', style: 't-violet' },
        { icon: <Users size={22} color="white" />, label: 'User Mgmt', path: '/admin/users', style: 't-indigo' },
        { icon: <ShieldCheck size={22} color="white" />, label: 'Password', path: '/admin/change-password', style: 't-red' },
        { icon: <DollarSign size={22} color="white" />, label: 'Fees', path: '/admin/dashboard', style: 't-lime' },
    ];

    return (
        <div className="dash-root">
            <NavBar
                role="admin"
                userName={user?.name}
                onLogout={handleLogout}
                links={[
                    { icon: '📝', label: 'Register Student', path: '/admin/register-student' },
                    { icon: '👨‍🏫', label: 'View Teachers', path: '/admin/teachers' },
                    { icon: '➕', label: 'Register Teacher', path: '/admin/register-teacher' },
                    { icon: '🏫', label: 'Manage Classes', path: '/admin/classes' },
                    { icon: '📣', label: 'School Notices', path: '/admin/notices' },
                    { icon: '✅', label: `Approvals${pendingApprovalsCount > 0 ? ` (${pendingApprovalsCount})` : ''}`, path: '/admin/approvals' },
                    { icon: '🔍', label: 'Student Search', path: '/admin/search' },
                    { icon: '👥', label: 'User Management', path: '/admin/users' },
                    { icon: '🔐', label: 'Change Password', path: '/admin/change-password' },
                ]}
            />

            <div className="dash-scroll">
                {/* Hero */}
                <div className="dash-hero">
                    <p className="hero-greeting">{getGreeting()} 👋</p>
                    <h1 className="hero-name">{user?.name?.split(' ')[0] || 'Admin'}</h1>
                    <span className="hero-role-badge">Administrator</span>
                </div>

                {/* Floating stat pills */}
                <div className="stats-row">
                    <div className="stat-pill pill-blue">
                        <div className="stat-pill-top">
                            <div className="stat-pill-icon"><Users size={18} /></div>
                        </div>
                        <div className="stat-pill-value">{loading ? '…' : (stats?.totalStudents ?? 0)}</div>
                        <div className="stat-pill-label">Students</div>
                    </div>
                    <div className="stat-pill pill-green">
                        <div className="stat-pill-top">
                            <div className="stat-pill-icon"><GraduationCap size={18} /></div>
                        </div>
                        <div className="stat-pill-value">{loading ? '…' : (stats?.totalTeachers ?? 0)}</div>
                        <div className="stat-pill-label">Teachers</div>
                    </div>
                    <div className="stat-pill pill-orange">
                        <div className="stat-pill-top">
                            <div className="stat-pill-icon"><School size={18} /></div>
                        </div>
                        <div className="stat-pill-value">{loading ? '…' : (stats?.totalClasses ?? 0)}</div>
                        <div className="stat-pill-label">Classes</div>
                    </div>
                    <div className="stat-pill pill-purple">
                        <div className="stat-pill-top">
                            <div className="stat-pill-icon"><BarChart3 size={18} /></div>
                        </div>
                        <div className="stat-pill-value">{loading ? '…' : `${stats?.attendanceToday?.rate ?? 0}%`}</div>
                        <div className="stat-pill-label">Attendance</div>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="section-header">
                    <h2 className="section-title">Quick Actions</h2>
                </div>
                <div className="action-grid">
                    {actions.map((a, i) => (
                        <button key={i} className="action-tile" onClick={() => navigate(a.path)}>
                            <div className={`tile-icon ${a.style}`}>
                                {a.icon}
                                {a.badge && <span className="tile-badge">{a.badge}</span>}
                            </div>
                            <span className="tile-label">{a.label}</span>
                        </button>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="section-header">
                    <h2 className="section-title">Recent Activity</h2>
                </div>
                <div className="activity-card">
                    <div className="activity-row">
                        <span className="activity-dot-lg dot-green" />
                        <div className="activity-text">
                            <div className="activity-title">Dashboard Loaded</div>
                            <div className="activity-desc">System is running normally</div>
                        </div>
                        <span className="activity-time">Now</span>
                    </div>
                    {pendingApprovalsCount > 0 && (
                        <div className="activity-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/approvals')}>
                            <span className="activity-dot-lg dot-blue" />
                            <div className="activity-text">
                                <div className="activity-title">{pendingApprovalsCount} Pending Approval{pendingApprovalsCount > 1 ? 's' : ''}</div>
                                <div className="activity-desc">Tap to review requests</div>
                            </div>
                            <span className="activity-time">›</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
