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

// Map of [StudentId]: { [SubjectId]: 'present' | 'absent' }
type AttendanceMap = Record<string, Record<string, 'present' | 'absent'>>;

function MarkAttendance() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>(({}));
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitProgress, setSubmitProgress] = useState({ total: 0, current: 0 });
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
            
            // Auto-select first subject if exists
            if (subjectsData.length > 0) {
                setSelectedSubjectIds([subjectsData[0]._id]);
            }

            // Initialize attendance map: all students 'present' for all subjects
            const initialMap: AttendanceMap = {};
            studentsData.forEach((s: Student) => {
                initialMap[s._id] = {};
                subjectsData.forEach((sub: Subject) => {
                    initialMap[s._id][sub._id] = 'present';
                });
            });
            setAttendanceMap(initialMap);
            setLoading(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load data' });
            setLoading(false);
        }
    };

    const toggleSubject = (id: string) => {
        setSelectedSubjectIds(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const updateStatus = (studentId: string, subjectId: string, status: 'present' | 'absent') => {
        setAttendanceMap(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [subjectId]: status
            }
        }));
    };

    const markAllPresent = () => {
        setAttendanceMap(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(sid => {
                selectedSubjectIds.forEach(subid => {
                    next[sid] = { ...next[sid], [subid]: 'present' };
                });
            });
            return next;
        });
        setMessage({ type: 'success', text: '✅ All students marked as Present for selected subjects' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSubjectIds.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one subject' });
            return;
        }

        setSubmitting(true);
        setMessage({ type: 'info', text: '🚀 Submitting attendance logs...' });
        setSubmitProgress({ total: selectedSubjectIds.length, current: 0 });

        try {
            for (let i = 0; i < selectedSubjectIds.length; i++) {
                const subId = selectedSubjectIds[i];
                const records = students.map(s => ({
                    studentId: s._id,
                    status: attendanceMap[s._id]?.[subId] || 'present',
                }));

                await attendanceService.bulkCreate({
                    classId: user.assignedClassId,
                    date,
                    subjectId: subId,
                    attendances: records,
                });
                setSubmitProgress(prev => ({ ...prev, current: i + 1 }));
            }

            setMessage({ type: 'success', text: '✅ All attendance records submitted successfully!' });
            setTimeout(() => navigate('/teacher/dashboard'), 2000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit some records' });
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
                    <div className="control-group">
                        <label>Select Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="form-input-styled" />
                    </div>

                    <div className="control-group">
                        <label>Select Subjects to Mark Today</label>
                        <div className="subject-pills-grid">
                            {subjects.map(sub => (
                                <button
                                    key={sub._id}
                                    type="button"
                                    className={`subject-pill ${selectedSubjectIds.includes(sub._id) ? 'active' : ''}`}
                                    onClick={() => toggleSubject(sub._id)}
                                >
                                    {sub.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="quick-actions">
                        <button type="button" onClick={markAllPresent} className="btn-outline-primary">✨ Mark All Present</button>
                    </div>
                </div>

                <div className="student-attendance-list">
                    <div className="list-header-info">
                        <span>{students.length} Students</span>
                        <span>Click a student to mark individual subjects</span>
                    </div>

                    {students.map(student => {
                        const isExpanded = expandedStudentId === student._id;
                        return (
                            <div 
                                key={student._id} 
                                className={`student-att-card ${isExpanded ? 'active' : ''}`}
                                onClick={() => setExpandedStudentId(isExpanded ? null : student._id)}
                            >
                                <div className="card-top">
                                    <div className="student-info-main">
                                        <div className="student-avatar-small">{student.name.charAt(0)}</div>
                                        <div className="student-text">
                                            <h3>{student.name}</h3>
                                            <p>{student.studentId}</p>
                                        </div>
                                    </div>
                                    <div className="card-status-summary">
                                        {selectedSubjectIds.length > 0 ? (
                                            <span className="status-badge">
                                                {selectedSubjectIds.filter(id => attendanceMap[student._id][id] === 'absent').length} Absent
                                            </span>
                                        ) : (
                                            <span className="status-badge warning">No Subject</span>
                                        )}
                                        <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="card-details" onClick={e => e.stopPropagation()}>
                                        <h4>Subject-wise Attendance</h4>
                                        <div className="subject-status-rows">
                                            {selectedSubjectIds.map(subId => {
                                                const subName = subjects.find(s => s._id === subId)?.name || 'Subject';
                                                const status = attendanceMap[student._id][subId] || 'present';
                                                return (
                                                    <div key={subId} className="subject-row">
                                                        <span>{subName}</span>
                                                        <div className="status-toggle-buttons">
                                                            <button 
                                                                type="button" 
                                                                className={`stat-btn present ${status === 'present' ? 'active' : ''}`}
                                                                onClick={() => updateStatus(student._id, subId, 'present')}
                                                            >
                                                                Present
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                className={`stat-btn absent ${status === 'absent' ? 'active' : ''}`}
                                                                onClick={() => updateStatus(student._id, subId, 'absent')}
                                                            >
                                                                Absent
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {selectedSubjectIds.length === 0 && (
                                                <p className="empty-msg">Please select subjects above first</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {message.text && (
                    <div className={`status-banner ${message.type}`}>
                        {message.text}
                        {submitting && (
                            <div className="progress-bar-container">
                                <div className="progress-fill" style={{ width: `${(submitProgress.current / submitProgress.total) * 100}%` }}></div>
                            </div>
                        )}
                    </div>
                )}

                <div className="sticky-submit-footer">
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        className="btn-submit-all" 
                        disabled={submitting || selectedSubjectIds.length === 0}
                    >
                        {submitting ? 'Submitting...' : `🚀 Submit Attendance (${selectedSubjectIds.length} Subjects)`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MarkAttendance;
