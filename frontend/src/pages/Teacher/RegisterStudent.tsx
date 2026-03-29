import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import api from '../../services/api';
import NavBar from '../../components/NavBar';
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
    phone: string;
    profileImage?: File;
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
        phone: '',
        guardianName: '',
        guardianPhone: '',
        address: '',
        classId: '',
        password: 'password123',
    });

    const [imagePreview, setImagePreview] = useState<string>('');
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

            await api.get('/classes');
            const assignedClasses = userData.assignedClasses || [];

            if (assignedClasses.length > 0) {
                setClasses(assignedClasses);
                if (assignedClasses.length === 1) {
                    setFormData(prev => ({ ...prev, classId: assignedClasses[0]._id }));
                }
            } else {
                setClasses([]);
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, profileImage: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/students/register', {
                studentId: formData.studentId,
                name: formData.name,
                email: formData.email,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                guardianName: formData.guardianName,
                guardianPhone: formData.guardianPhone,
                address: formData.address,
                phone: formData.phone,
                classId: formData.classId,
                password: formData.password,
            });

            const studentObjectId = response.data.student._id;

            if (formData.profileImage) {
                const imageFormData = new FormData();
                imageFormData.append('image', formData.profileImage);
                imageFormData.append('studentId', studentObjectId);

                try {
                    await api.post('/students/upload-image', imageFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                } catch (imgError) {
                    console.warn('Image upload failed, but student created:', imgError);
                }
            }

            setSuccess(`✅ Student ${formData.name} registered successfully! ID: ${formData.studentId}`);

            // Reset form
            setFormData({
                studentId: '',
                name: '',
                email: '',
                dateOfBirth: '',
                gender: 'male',
                phone: '',
                guardianName: '',
                guardianPhone: '',
                address: '',
                classId: '',
                password: 'password123',
            });
            setImagePreview('');

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
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="← Dashboard" />

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
                            <h3>Profile Photo (Optional)</h3>
                            <div className="image-upload">
                                <div className="image-preview">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="placeholder" style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: '2rem' }}>📷</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="profileImage"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="file-input"
                                />
                                <label htmlFor="profileImage" className="file-label btn btn-secondary" style={{ marginTop: '10px', display: 'inline-block', cursor: 'pointer' }}>
                                    Choose Photo
                                </label>
                            </div>
                        </div>

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
                                <div className="form-group">
                                    <label>Gender *</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} required>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Student Phone *</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 1234567890" required />
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
