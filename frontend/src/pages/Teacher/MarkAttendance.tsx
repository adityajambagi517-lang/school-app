import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, attendanceService, studentsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './MarkAttendance.css';

interface Student {
    _id: string;
    studentId: string;
    name: string;
}

// Map of [StudentId]: 'present' | 'absent'
type AttendanceMap = Record<string, 'present' | 'absent'>;

function MarkAttendance() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const assignedClasses = (user as any)?.assignedClasses || [];
    
    const [activeTab, setActiveTab] = useState<string>(
        assignedClasses.length > 0 ? assignedClasses[0]._id : ''
    );
    const [students, setStudents] = useState<Student[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (activeTab && date) {
            loadData(activeTab, date);
        } else {
            setLoading(false);
        }
    }, [activeTab, date]);

    const loadData = async (classId: string, currentDate: string) => {
        try {
            setLoading(true);
            const [studentsData, existingAttendance] = await Promise.all([
                studentsService.getByClass(classId),
                attendanceService.getByClass(classId, currentDate),
            ]);
            
            setStudents(studentsData);
            
            // Map existing attendance 
            const existingMap = existingAttendance?.reduce((acc: any, curr: any) => {
                 const id = typeof curr.studentId === 'object' ? curr.studentId._id : curr.studentId;
                 acc[id] = curr.status;
                 return acc;
            }, {});

            const initialMap: AttendanceMap = {};
            studentsData.forEach((s: Student) => {
                initialMap[s._id] = existingMap?.[s._id] || 'present';
            });
            setAttendanceMap(initialMap);
            setLoading(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load data for this date' });
            setLoading(false);
        }
    };

    const updateStatus = (studentId: string, status: 'present' | 'absent') => {
        setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
    };

    const markAllPresent = () => {
        setAttendanceMap(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(sid => next[sid] = 'present');
            return next;
        });
        setMessage({ type: 'success', text: '✅ All students marked as Present' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: 'info', text: '🚀 Submitting attendance...' });

        try {
            const records = students.map(s => ({
                studentId: s._id,
                status: attendanceMap[s._id] || 'present',
            }));

            await attendanceService.bulkCreate({
                classId: activeTab,
                date,
                attendances: records,
            });

            setMessage({ type: 'success', text: '✅ Attendance saved successfully!' });
            // Allow them to look at it instead of immediately navigating away!
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit records' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => { authService.logout(); navigate('/login'); };

    if (loading) return <div className="dash-root">Loading...</div>;

    return (
        <div className="dash-root">
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="← Dashboard" />

            <div className="dash-scroll attendance-container">
                <div className="dash-hero attendance-hero">
                    <p className="hero-greeting">Simplified Attendance 📅</p>
                    <h1 className="hero-name">Mark Daily Progress</h1>
                </div>

                <div className="attendance-controls card-shadow">
                    {assignedClasses.length > 0 ? (
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                {assignedClasses.map((cls: any) => (
                                    <button
                                        key={cls._id}
                                        className={`btn ${activeTab === cls._id ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setActiveTab(cls._id)}
                                        style={{ borderRadius: '20px', padding: '8px 16px', fontWeight: activeTab === cls._id ? '700' : '500', whiteSpace: 'nowrap' }}
                                    >
                                        Class {cls.className} - {cls.section}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="alert alert-error mb-4">No classes assigned.</div>
                    )}

                    <div className="control-group">
                        <label>Select Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="form-input-styled" />
                    </div>

                    <div className="quick-actions">
                        <button type="button" onClick={markAllPresent} className="btn-outline-primary">✨ Mark All Present</button>
                    </div>
                </div>

                <div className="student-attendance-list">
                    <div className="list-header-info">
                        <span>{students.length} Students</span>
                        <span>Click to mark Present or Absent</span>
                    </div>

                    {students.map(student => {
                        const status = attendanceMap[student._id] || 'present';
                        return (
                            <div key={student._id} className={`student-att-card active`}>
                                <div className="card-top">
                                    <div className="student-info-main">
                                        <div className="student-avatar-small">{student.name.charAt(0)}</div>
                                        <div className="student-text">
                                            <h3>{student.name}</h3>
                                            <p>{student.studentId}</p>
                                        </div>
                                    </div>
                                    <div className="status-toggle-buttons">
                                        <button 
                                            type="button" 
                                            className={`stat-btn present ${status === 'present' ? 'active' : ''}`}
                                            onClick={() => updateStatus(student._id, 'present')}
                                        >
                                            Present
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`stat-btn absent ${status === 'absent' ? 'active' : ''}`}
                                            onClick={() => updateStatus(student._id, 'absent')}
                                        >
                                            Absent
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {message.text && (
                    <div className={`status-banner ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="sticky-submit-footer">
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        className="btn-submit-all" 
                        disabled={submitting || !activeTab}
                    >
                        {submitting ? 'Submitting...' : `🚀 Submit Daily Attendance`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MarkAttendance;
