import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, homeworkService, subjectsService, studentsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import '../Teacher/Dashboard.css';

interface Subject {
    _id: string;
    name: string;
}

interface Student {
    _id: string;
    studentId: string;
    name: string;
}

interface Homework {
    _id: string;
    subject: string;
    title: string;
    description: string;
    dueDate: string;
    assignmentType: string;
    studentId?: string;
}

function ManageHomework() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [homework, setHomework] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        subject: '',
        title: '',
        description: '',
        dueDate: '',
        assignmentType: 'ALL_STUDENTS',
        studentId: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            if (!user?.assignedClassId) {
                setMessage({ type: 'error', text: 'No class assigned to your account. Please contact admin.' });
                setLoading(false);
                return;
            }

            const [subjectsData, studentsData, homeworkData] = await Promise.all([
                subjectsService.getAll(),
                studentsService.getByClass(user.assignedClassId),
                homeworkService.getByClass(user.assignedClassId),
            ]);
            setSubjects(subjectsData);
            setStudents(studentsData);
            setHomework(homeworkData);
            setLoading(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load data' });
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            if (!user?.assignedClassId) {
                setMessage({ type: 'error', text: 'No class assigned to your account' });
                setSubmitting(false);
                return;
            }

            const payload: any = {
                classId: user.assignedClassId,
                subject: formData.subject,
                title: formData.title,
                description: formData.description,
                dueDate: formData.dueDate,
                assignmentType: formData.assignmentType,
            };

            if (formData.assignmentType === 'INDIVIDUAL' && formData.studentId) {
                payload.studentId = formData.studentId;
            }

            await homeworkService.create(payload);
            setMessage({ type: 'success', text: 'Homework assigned successfully!' });
            setFormData({
                subject: '',
                title: '',
                description: '',
                dueDate: '',
                assignmentType: 'ALL_STUDENTS',
                studentId: '',
            });
            loadData();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to assign homework' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this homework?')) {
            return;
        }

        try {
            await homeworkService.delete(id);
            setMessage({ type: 'success', text: 'Homework deleted successfully!' });
            loadData();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete homework' });
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
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>📝 Manage Homework</h1>
                    <p>Assign homework to students</p>
                </div>

                {message.text && (
                    <div className={`message message-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form-container">
                    <div className="form-group">
                        <label>Subject *</label>
                        <select
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                            className="form-input"
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(subject => (
                                <option key={subject._id} value={subject.name}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Chapter 5 Problems"
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Homework details and instructions"
                            required
                            className="form-input"
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label>Due Date *</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Assignment Type *</label>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="radio"
                                    name="assignmentType"
                                    value="ALL_STUDENTS"
                                    checked={formData.assignmentType === 'ALL_STUDENTS'}
                                    onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value, studentId: '' })}
                                    style={{ marginRight: '0.5rem' }}
                                />
                                All Students
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="radio"
                                    name="assignmentType"
                                    value="INDIVIDUAL"
                                    checked={formData.assignmentType === 'INDIVIDUAL'}
                                    onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
                                    style={{ marginRight: '0.5rem' }}
                                />
                                Specific Student
                            </label>
                        </div>
                    </div>

                    {formData.assignmentType === 'INDIVIDUAL' && (
                        <div className="form-group">
                            <label>Select Student *</label>
                            <select
                                value={formData.studentId}
                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                required
                                className="form-input"
                            >
                                <option value="">Select Student</option>
                                {students.map(student => (
                                    <option key={student._id} value={student._id}>
                                        {student.studentId} - {student.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Assigning...' : 'Assign Homework'}
                    </button>
                </form>

                {/* Homework List */}
                <div style={{ marginTop: '2rem' }}>
                    <h3>Recent Homework</h3>
                    {homework.length === 0 ? (
                        <p>No homework assigned yet.</p>
                    ) : (
                        <div className="attendance-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Title</th>
                                        <th>Due Date</th>
                                        <th>Type</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {homework.map(hw => (
                                        <tr key={hw._id}>
                                            <td>{hw.subject}</td>
                                            <td>{hw.title}</td>
                                            <td>{new Date(hw.dueDate).toLocaleDateString()}</td>
                                            <td>{hw.assignmentType === 'ALL_STUDENTS' ? 'All Students' : 'Individual'}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleDelete(hw._id)}
                                                    className="btn btn-logout"
                                                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem' }}
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
            </div>
        </div>
    );
}

export default ManageHomework;
