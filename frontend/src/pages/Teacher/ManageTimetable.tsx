import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, timetableService, subjectsService } from '../../services/api';
import './Dashboard.css';

interface TimetableItem {
    _id?: string;
    dayOfWeek: number;
    period: number;
    subject: string;
    startTime: string;
    endTime: string;
    teacherId: string;
    classId: string;
}

function ManageTimetable() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [timetable, setTimetable] = useState<TimetableItem[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState({
        dayOfWeek: 1, // Monday
        period: 1,
        subject: '',
        startTime: '09:00',
        endTime: '10:00',
    });

    const days = [
        { name: 'Monday', index: 1 },
        { name: 'Tuesday', index: 2 },
        { name: 'Wednesday', index: 3 },
        { name: 'Thursday', index: 4 },
        { name: 'Friday', index: 5 },
        { name: 'Saturday', index: 6 },
        { name: 'Sunday', index: 0 },
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const classId = user.assignedClassId;
            if (classId) {
                const [timetableData, subjectsData] = await Promise.all([
                    timetableService.getByClass(classId),
                    subjectsService.getAll(),
                ]);
                setTimetable(timetableData);
                setSubjects(subjectsData);
            }
        } catch (error) {
            console.error('Failed to load timetable data:', error);
            setMessage({ type: 'error', text: 'Failed to load timetable data' });
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        try {
            const payload = {
                ...formData,
                classId: user.assignedClassId,
                teacherId: user.referenceId,
            };

            await timetableService.create(payload);
            setMessage({ type: 'success', text: 'Period added successfully!' });
            setIsAdding(false);
            loadData();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add period' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this period?')) return;
        try {
            await timetableService.delete(id);
            setMessage({ type: 'success', text: 'Period deleted' });
            loadData();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete period' });
        }
    };

    const getDaySchedule = (dayIndex: number) => {
        return timetable
            .filter((t) => t.dayOfWeek === dayIndex)
            .sort((a, b) => a.period - b.period);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) return <div className="dashboard-container">Loading...</div>;

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h2>School Management</h2>
                    <span className="badge badge-teacher">Teacher</span>
                </div>
                <div className="nav-user">
                    <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-secondary">
                        ← Back
                    </button>
                    <span className="user-name">{user?.name}</span>
                    <button onClick={handleLogout} className="btn btn-logout">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>📅 Manage Timetable</h1>
                        <p>Weekly schedule for {user.className} - {user.section}</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                        + Add Period
                    </button>
                </div>

                {message.text && (
                    <div className={`message message-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {isAdding && (
                    <div className="dashboard-card" style={{ marginBottom: '20px', border: '2px solid #667eea' }}>
                        <h3>Add New Period</h3>
                        <form onSubmit={handleAdd} className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Day</label>
                                <select
                                    className="form-input"
                                    value={formData.dayOfWeek}
                                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                                >
                                    {days.map(d => <option key={d.index} value={d.index}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Period #</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    max="10"
                                    value={formData.period}
                                    onChange={(e) => setFormData({ ...formData, period: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <select
                                    className="form-input"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Start Time</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>End Time</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary">Save Period</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="timetable-management-grid">
                    {days.map((day) => (
                        <div key={day.name} className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{day.name}</h3>
                            {getDaySchedule(day.index).length === 0 ? (
                                <p style={{ color: '#999', fontStyle: 'italic' }}>No periods scheduled</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Period</th>
                                                <th>Subject</th>
                                                <th>Time</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getDaySchedule(day.index).map((item) => (
                                                <tr key={item._id}>
                                                    <td>{item.period}</td>
                                                    <td><strong>{item.subject}</strong></td>
                                                    <td>{item.startTime} - {item.endTime}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-logout"
                                                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                                            onClick={() => item._id && handleDelete(item._id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ManageTimetable;
