import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, attendanceService, studentsService, subjectsService } from '../../services/api';
import '../Teacher/Dashboard.css';

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
    status: 'present' | 'absent' | 'late';
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
        return <div className="dashboard-container">Loading...</div>;
    }

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
                <div className="page-header">
                    <h1>✅ Mark Attendance</h1>
                    <p>Record attendance for your class</p>
                </div>

                {message.text && (
                    <div className={`message message-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="attendance-form">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label>Date *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Subject *</label>
                            <select
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="form-input"
                                required
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(subject => (
                                    <option key={subject._id} value={subject._id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                            <small style={{ color: '#666', fontSize: '0.85rem' }}>
                                Subject is required for marking attendance
                            </small>
                        </div>
                    </div>
                    <div className="attendance-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => {
                                    const record = attendanceRecords.find(r => r.studentId === student._id);
                                    return (
                                        <tr key={student._id}>
                                            <td>{student.studentId}</td>
                                            <td>{student.name}</td>
                                            <td>
                                                <div className="radio-group">
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            name={`status-${student._id}`}
                                                            value="present"
                                                            checked={record?.status === 'present'}
                                                            onChange={(e) => updateAttendance(student._id, 'status', e.target.value)}
                                                        />
                                                        Present
                                                    </label>
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            name={`status-${student._id}`}
                                                            value="absent"
                                                            checked={record?.status === 'absent'}
                                                            onChange={(e) => updateAttendance(student._id, 'status', e.target.value)}
                                                        />
                                                        Absent
                                                    </label>
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            name={`status-${student._id}`}
                                                            value="late"
                                                            checked={record?.status === 'late'}
                                                            onChange={(e) => updateAttendance(student._id, 'status', e.target.value)}
                                                        />
                                                        Late
                                                    </label>
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    placeholder="Optional remarks"
                                                    value={record?.remarks || ''}
                                                    onChange={(e) => updateAttendance(student._id, 'remarks', e.target.value)}
                                                    className="form-input"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Attendance'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default MarkAttendance;
