import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, markcardsService, studentsService, subjectsService } from '../../services/api';
import '../Teacher/Dashboard.css';

interface Student {
    _id: string;
    studentId: string;
    name: string;
    classId: {
        className: string;
        section: string;
    };
}

interface Subject {
    _id: string;
    name: string;
}

interface SubjectMark {
    subject: string;
    marks: string;
    maxMarks: string;
}

function EnterMarks() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [examType, setExamType] = useState('');
    const [subjectMarks, setSubjectMarks] = useState<SubjectMark[]>([]);

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
            setLoading(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load data' });
            setLoading(false);
        }
    };

    const handleStudentChange = (studentId: string) => {
        setSelectedStudentId(studentId);
        const student = students.find(s => s._id === studentId);
        setSelectedStudent(student || null);

        // Initialize subject marks with all subjects
        if (student) {
            const initialMarks = subjects.map(subject => ({
                subject: subject.name,
                marks: '',
                maxMarks: '100',
            }));
            setSubjectMarks(initialMarks);
        }
    };

    const handleMarkChange = (subjectName: string, field: 'marks' | 'maxMarks', value: string) => {
        setSubjectMarks(prev => prev.map(sm =>
            sm.subject === subjectName
                ? { ...sm, [field]: value }
                : sm
        ));
    };

    const calculateTotalPercentage = (): { totalMarks: number; totalMaxMarks: number; percentage: string; count: number } => {
        let totalMarks = 0;
        let totalMaxMarks = 0;
        let count = 0;

        subjectMarks.forEach(sm => {
            if (sm.marks && sm.marks.trim() !== '') {
                const marks = parseFloat(sm.marks);
                const maxMarks = parseFloat(sm.maxMarks);
                if (!isNaN(marks) && !isNaN(maxMarks)) {
                    totalMarks += marks;
                    totalMaxMarks += maxMarks;
                    count++;
                }
            }
        });

        const percentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(2) : '0.00';
        return { totalMarks, totalMaxMarks, percentage, count };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            // Filter out subjects with no marks entered
            const marksToSubmit = subjectMarks.filter(sm => sm.marks && sm.marks.trim() !== '');

            if (marksToSubmit.length === 0) {
                throw new Error('Please enter marks for at least one subject');
            }

            // Validate all marks
            for (const mark of marksToSubmit) {
                const marks = parseFloat(mark.marks);
                const maxMarks = parseFloat(mark.maxMarks);

                if (isNaN(marks) || marks < 0) {
                    throw new Error(`Invalid marks for ${mark.subject}`);
                }
                if (isNaN(maxMarks) || maxMarks <= 0) {
                    throw new Error(`Invalid maximum marks for ${mark.subject}`);
                }
                if (marks > maxMarks) {
                    throw new Error(`Marks cannot exceed maximum marks for ${mark.subject}`);
                }
            }

            // Submit bulk marks
            await markcardsService.bulkCreate({
                studentId: selectedStudentId,
                classId: user.assignedClassId,
                examType,
                marks: marksToSubmit.map(sm => ({
                    subject: sm.subject,
                    marks: parseFloat(sm.marks),
                    maxMarks: parseFloat(sm.maxMarks),
                })),
            });

            setMessage({
                type: 'success',
                text: `Successfully submitted ${marksToSubmit.length} subject marks for admin approval!`
            });

            // Reset form
            setSelectedStudentId('');
            setSelectedStudent(null);
            setExamType('');
            setSubjectMarks([]);

            // Scroll to top to see success message
            window.scrollTo(0, 0);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || error.message || 'Failed to submit marks' });
            window.scrollTo(0, 0);
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
                    <h1>📊 Enter Marks</h1>
                    <p>Enter marks for all subjects at once</p>
                </div>

                {message.text && (
                    <div className={`message message-${message.type}`} style={{ marginBottom: '1.5rem' }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form-container">
                    {/* Step 1: Select Student */}
                    <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
                        <h3>Step 1: Select Student</h3>
                        <div className="form-group">
                            <select
                                value={selectedStudentId}
                                onChange={(e) => handleStudentChange(e.target.value)}
                                required
                                className="form-input"
                            >
                                <option value="">-- Select Student --</option>
                                {students.map(student => (
                                    <option key={student._id} value={student._id}>
                                        {student.studentId} - {student.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedStudent && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                borderRadius: '8px'
                            }}>
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>👤 {selectedStudent.name}</h4>
                                <p style={{ margin: 0 }}>
                                    <strong>Student ID:</strong> {selectedStudent.studentId} |
                                    <strong> Class:</strong> {selectedStudent.classId.className} - {selectedStudent.classId.section}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Select Exam Type */}
                    {selectedStudent && (
                        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
                            <h3>Step 2: Select Exam Type</h3>
                            <div className="form-group">
                                <select
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value)}
                                    required
                                    className="form-input"
                                >
                                    <option value="">-- Select Exam Type --</option>
                                    <option value="Unit Test 1">Unit Test 1</option>
                                    <option value="Unit Test 2">Unit Test 2</option>
                                    <option value="Mid Term">Mid Term</option>
                                    <option value="Final Term">Final Term</option>
                                    <option value="Assignment">Assignment</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Enter Marks for All Subjects */}
                    {selectedStudent && examType && (
                        <div className="dashboard-card">
                            <h3>Step 3: Enter Marks for All Subjects</h3>
                            <p style={{ color: '#666', marginBottom: '1rem' }}>
                                ℹ️ Enter marks for each subject. Leave blank to skip a subject.
                            </p>

                            <div className="attendance-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Marks Obtained</th>
                                            <th>Maximum Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjectMarks.map((sm, index) => (
                                            <tr key={index}>
                                                <td><strong>{sm.subject}</strong></td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={sm.marks}
                                                        onChange={(e) => handleMarkChange(sm.subject, 'marks', e.target.value)}
                                                        placeholder="e.g., 85"
                                                        min="0"
                                                        step="0.01"
                                                        className="form-input"
                                                        style={{ minWidth: '100px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={sm.maxMarks}
                                                        onChange={(e) => handleMarkChange(sm.subject, 'maxMarks', e.target.value)}
                                                        placeholder="e.g., 100"
                                                        min="1"
                                                        step="1"
                                                        className="form-input"
                                                        style={{ minWidth: '100px' }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Total Percentage Summary */}
                            {(() => {
                                const total = calculateTotalPercentage();
                                if (total.count > 0) {
                                    return (
                                        <div style={{
                                            marginTop: '1.5rem',
                                            padding: '1.5rem',
                                            background: parseFloat(total.percentage) >= 40
                                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                            color: 'white',
                                            borderRadius: '12px',
                                            textAlign: 'center'
                                        }}>
                                            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem' }}>
                                                {total.percentage}%
                                            </h2>
                                            <p style={{ margin: '0', fontSize: '1.1rem', opacity: 0.9 }}>
                                                <strong>Total Performance</strong>
                                            </p>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', opacity: 0.8 }}>
                                                {total.totalMarks} / {total.totalMaxMarks} marks across {total.count} subjects
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                                style={{ marginTop: '1.5rem', width: '100%', fontSize: '1.1rem', padding: '14px' }}
                            >
                                {submitting ? 'Submitting for Approval...' : '✅ Submit All Marks for Admin Approval'}
                            </button>
                        </div>
                    )}
                </form>

                {!selectedStudent && (
                    <div className="info-box">
                        <p>ℹ️ <strong>How it works:</strong></p>
                        <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                            <li>Select a student from the dropdown</li>
                            <li>Choose the exam type (applies to all subjects)</li>
                            <li>Enter marks for all subjects in the table</li>
                            <li>Click submit - all marks will be sent to admin for approval at once!</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EnterMarks;
