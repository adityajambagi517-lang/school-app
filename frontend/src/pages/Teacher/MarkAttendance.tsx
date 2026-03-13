import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, attendanceService, studentsService, subjectsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './MarkAttendance.css';

interface Student {
    _id: string;
    studentId: string;
    name: string;
}

interface Subject {
    _id: string;
    name: string;
}

interface AttendanceRecord {
    studentId: string;
    status: 'present' | 'absent';
    remarks?: string;
}

function MarkAttendance() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [subjectId, setSubjectId] = useState('');
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            if (!user?.assignedClassId) {
                setMessage({ type: 'error', text: 'No class assigned to your account' });
                setLoading(false);
                return;
            }

            const [studentsData, subjectsData] = await Promise.all([
                studentsService.getByClass(user.assignedClassId),
                subjectsService.getAll(),
            ]);
            setStudents(studentsData);
            setSubjects(subjectsData);

            // Initialize attendance records with all students marked as present
            const initialRecords = studentsData.map((student: Student) => ({
                studentId: student._id,
                status: 'present' as const,
                remarks: '',
            }));
            setAttendanceRecords(initialRecords);
            setLoading(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load data' });
            setLoading(false);
        }
    };

    const updateAttendance = (studentId: string, field: string, value: any) => {
        setAttendanceRecords(prev => prev.map(record =>
            record.studentId === studentId
                ? { ...record, [field]: value }
                : record
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        if (!subjectId) {
            setMessage({ type: 'error', text: 'Please select a subject' });
            setSubmitting(false);
            return;
        }

        try {
            const payload: any = {
                classId: user.assignedClassId,
                date,
                subjectId,
                attendances: attendanceRecords,
            };

            await attendanceService.bulkCreate(payload);
            setMessage({ type: 'success', text: 'Attendance marked successfully!' });
            setTimeout(() => navigate('/teacher/dashboard'), 2000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to mark attendance' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="dash-root">Loading...</div>;
    }

    return (
        <div className="dash-root">
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="← Dashboard" />

            <div className="dash-scroll" style={{ padding: '0 16px' }}>
                <div className="dash-hero" style={{ padding: '20px', marginBottom: '24px', borderRadius: '0 0 24px 24px' }}>
                    <p className="hero-greeting">Record Daily Logs 📝</p>
                    <h1 className="hero-name">Mark Attendance</h1>
                </div>

                {message.text && (
                    <div className={`activity-card`} style={{ borderLeft: `4px solid ${message.type === 'success' ? '#48bb78' : '#f56565'}`, marginBottom: '1rem' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>{message.text}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="attendance-form">
                    <div className="form-grid-responsive" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Date *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Subject *</label>
                            <select
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="form-input"
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(subject => (
                                    <option key={subject._id} value={subject._id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="attendance-table">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Student</th>
                                    <th>Status</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => {
                                    const record = attendanceRecords.find(r => r.studentId === student._id);
                                    return (
                                        <tr key={student._id}>
                                            <td data-label="ID">{student.studentId}</td>
                                            <td data-label="Student">{student.name}</td>
                                            <td data-label="Status">
                                                <div className="radio-group">
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            name={`status-${student._id}`}
                                                            value="present"
                                                            checked={record?.status === 'present'}
                                                            onChange={(e) => updateAttendance(student._id, 'status', e.target.value)}
                                                        />
                                                        P
                                                    </label>
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            name={`status-${student._id}`}
                                                            value="absent"
                                                            checked={record?.status === 'absent'}
                                                            onChange={(e) => updateAttendance(student._id, 'status', e.target.value)}
                                                        />
                                                        A
                                                    </label>
                                                </div>
                                            </td>
                                            <td data-label="Remarks">
                                                <input
                                                    type="text"
                                                    placeholder="Remarks"
                                                    value={record?.remarks || ''}
                                                    onChange={(e) => updateAttendance(student._id, 'remarks', e.target.value)}
                                                    className="form-input"
                                                    style={{ padding: '6px 10px', fontSize: '13px' }}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '12px', fontWeight: 700, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        {submitting ? 'Submitting...' : 'Submit Attendance'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default MarkAttendance;
