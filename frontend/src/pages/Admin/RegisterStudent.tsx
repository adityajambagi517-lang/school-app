import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import api from '../../services/api';
import NavBar from '../../components/NavBar';
import './RegisterStudent.css';

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
    phone: string;
    guardianName: string;
    guardianPhone: string;
    address: string;
    classId: string;
    password: string;
    profileImage?: File;
}

function RegisterStudent() {
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
            const response = await api.get('/classes');
            setClasses(response.data);
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
            // Use combined register endpoint
            const response = await api.post('/students/register', {
                studentId: formData.studentId,
                name: formData.name,
                email: formData.email,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                guardianName: formData.guardianName,
                guardianPhone: formData.guardianPhone,
                address: formData.address,
                classId: formData.classId,
                password: formData.password,
            });

            const studentObjectId = response.data.student._id;

            // Upload profile image if provided
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

            setSuccess(`✅ Student ${formData.name} registered successfully! Login ID: ${formData.studentId}, Password: ${formData.password}`);

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

            // Auto-redirect after 5 seconds
            setTimeout(() => navigate('/admin/dashboard'), 5000);

        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || err.message || 'Registration failed. Please check all fields and try again.');
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
            <NavBar
                role="admin"
                userName={user?.name}
                onLogout={handleLogout}
                backTo="/admin/dashboard"
                backLabel="← Back to Dashboard"
            />

            <div className="register-content">
                <div className="register-card">
                    <div className="register-header">
                        <h1>Register New Student</h1>
                        <p>Fill in the details below to create a new student account</p>
                    </div>

                    {error && <div className="alert alert-error"> ❌ {error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <form onSubmit={handleSubmit} className="register-form">
                        {/* Profile Image */}
                        <div className="form-section">
                            <h3>Profile Photo (Optional)</h3>
                            <div className="image-upload">
                                <div className="image-preview">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" />
                                    ) : (
                                        <div className="placeholder">
                                            <span>📷</span>
                                            <p>No image selected</p>
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
                                <label htmlFor="profileImage" className="file-label">
                                    Choose Photo
                                </label>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="form-section">
                            <h3>Personal Information</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Student ID *</label>
                                    <input
                                        type="text"
                                        name="studentId"
                                        value={formData.studentId}
                                        onChange={handleChange}
                                        placeholder="e.g., STU006"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="student@gmail.com"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Date of Birth *</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        required
                                    />
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
                                    <label>Phone *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 1234567890"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Guardian Information */}
                        <div className="form-section">
                            <h3>Guardian Information</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Guardian Name *</label>
                                    <input
                                        type="text"
                                        name="guardianName"
                                        value={formData.guardianName}
                                        onChange={handleChange}
                                        placeholder="Parent/Guardian name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Guardian Phone *</label>
                                    <input
                                        type="tel"
                                        name="guardianPhone"
                                        value={formData.guardianPhone}
                                        onChange={handleChange}
                                        placeholder="+91 1234567890"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Address *</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Full residential address"
                                    rows={3}
                                    required
                                />
                            </div>
                        </div>

                        {/* Academic Information */}
                        <div className="form-section">
                            <h3>Academic Information</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Select Class *</label>
                                    <select
                                        name="classId"
                                        value={formData.classId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">-- Choose Class --</option>
                                        {classes.map((cls) => (
                                            <option key={cls._id} value={cls._id}>
                                                Class {cls.className} - Section {cls.section} ({cls.academicYear})
                                            </option>
                                        ))}
                                    </select>
                                    <small>{classes.length} classes available</small>
                                </div>

                                <div className="form-group">
                                    <label>Initial Password *</label>
                                    <input
                                        type="text"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Default: password123"
                                        required
                                    />
                                    <small>Student can change this after first login</small>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="form-actions">
                            <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn btn-cancel">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? '⏳ Registering...' : '✅ Register Student'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RegisterStudent;

