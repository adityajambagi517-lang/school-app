import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, feesService, studentsService } from '../../services/api';
import '../Teacher/Dashboard.css';

interface Student {
    _id: string;
    studentId: string;
    name: string;
}

function ManageFees() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        studentId: '',
        academicYear: new Date().getFullYear().toString(),
        termName: '',
        amount: '',
        dueDate: '',
    });

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            if (!user?.assignedClassId) {
                setMessage({ type: 'error', text: 'No class assigned to your account' });
                setLoading(false);
                return;
            }

            const data = await studentsService.getByClass(user.assignedClassId);
            setStudents(data);
            setLoading(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load students' });
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            await feesService.create({
                studentId: formData.studentId,
                academicYear: formData.academicYear,
                termName: formData.termName,
                amount: Number(formData.amount),
                dueDate: formData.dueDate,
            });

            setMessage({ type: 'success', text: 'Fee record created successfully! (Draft saved)' });
            setFormData({
                studentId: '',
                academicYear: new Date().getFullYear().toString(),
                termName: '',
                amount: '',
                dueDate: '',
            });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create fee record' });
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
                    <h1>💰 Manage Fees</h1>
                    <p>Create and manage student fee records</p>
                </div>

                {message.text && (
                    <div className={`message message-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form-container">
                    <div className="form-group">
                        <label>Student *</label>
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

                    <div className="form-row">
                        <div className="form-group">
                            <label>Academic Year *</label>
                            <input
                                type="text"
                                value={formData.academicYear}
                                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                placeholder="e.g., 2024"
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Term *</label>
                            <select
                                value={formData.termName}
                                onChange={(e) => setFormData({ ...formData, termName: e.target.value })}
                                required
                                className="form-input"
                            >
                                <option value="">Select Term</option>
                                <option value="Term 1">Term 1</option>
                                <option value="Term 2">Term 2</option>
                                <option value="Term 3">Term 3</option>
                                <option value="Annual">Annual</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Amount (₹) *</label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="e.g., 10000"
                                min="0"
                                required
                                className="form-input"
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
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create Fee Record (Draft)'}
                    </button>
                </form>

                <div className="info-box">
                    <p>ℹ️ Fee records are saved as drafts. Submit them for admin approval to publish to students.</p>
                </div>
            </div>
        </div>
    );
}

export default ManageFees;
