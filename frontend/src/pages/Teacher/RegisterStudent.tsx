import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import api from '../../services/api';
import '../Admin/RegisterStudent.css'; // Reuse CSS

interface Class {
    _id: string;
    className: string;
    section: string;
    academicYear: string;
}

interface StudentFormData {
    studentId: string;
    name: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    guardianName: string;
    guardianPhone: string;
    address: string;
    classId: string;
    password: string;
}

function TeacherRegisterStudent() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [formData, setFormData] = useState<StudentFormData>({
        studentId: '',
        name: '',
        email: '',
        dateOfBirth: '',
        gender: 'male',
        guardianName: '',
        guardianPhone: '',
        address: '',
        classId: '',
        password: 'password123',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [classes, setClasses] = useState<Class[]>([]);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            // Refresh user data to get the latest assignedClassId
            const userData = await authService.getMe();

            const response = await api.get('/classes');
            const allClasses = response.data;

            // If teacher is assigned to a class, filter to only that class
            // Based on AuthService.getUserProfile, assignedClassId is directly on the user object for teachers
            const assignedClassId = userData.assignedClassId;

            if (assignedClassId) {
                const filtered = allClasses.filter((c: any) => c._id === assignedClassId.toString());
                setClasses(filtered);
                if (filtered.length > 0) {
                    setFormData(prev => ({ ...prev, classId: filtered[0]._id }));
                }
            } else {
                setClasses(allClasses);
            }
        } catch (err) {
            console.error('Failed to fetch classes:', err);
            setError('Failed to load classes. Please refresh the page.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/students/register', formData);
            setSuccess(`✅ Student ${formData.name} registered successfully! ID: ${formData.studentId}`);

            // Reset form
            setFormData({
                studentId: '',
                name: '',
                email: '',
                dateOfBirth: '',
                gender: 'male',
                guardianName: '',
                guardianPhone: '',
                address: '',
                classId: '',
                password: 'password123',
            });

            // Redirect back to dashboard after a delay
            setTimeout(() => navigate('/teacher/dashboard'), 3000);
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Registration failed. Please check all fields.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="register-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h2>School Management</h2>
                    <span className="badge badge-teacher">Teacher</span>
                </div>
                <div className="nav-user">
                    <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-secondary">
                        ← Back to Dashboard
                    </button>
                    <span className="user-name">{user?.name}</span>
                    <button onClick={handleLogout} className="btn btn-logout">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="register-content">
                <div className="register-card">
                    <div className="register-header">
                        <h1>Register Student</h1>
                        <p>Add a new student to your class</p>
                    </div>

                    {error && <div className="alert alert-error"> ❌ {error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <form onSubmit={handleSubmit} className="register-form">
                        <div className="form-section">
                            <h3>Personal Details</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Student ID *</label>
                                    <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth *</label>
                                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Guardian & Guardian Contact</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Guardian Name *</label>
                                    <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Guardian Phone *</label>
                                    <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Address *</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} required rows={2} />
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Class Assignment</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Select Class *</label>
                                    <select name="classId" value={formData.classId} onChange={handleChange} required>
                                        <option value="">-- Choose Class --</option>
                                        {classes.map((cls) => (
                                            <option key={cls._id} value={cls._id}>
                                                Class {cls.className} - {cls.section}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Default Password *</label>
                                    <input type="text" name="password" value={formData.password} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Registering...' : '✅ Confirm Student Registration'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TeacherRegisterStudent;
