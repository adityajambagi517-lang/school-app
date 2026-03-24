import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import api from '../../services/api';
import NavBar from '../../components/NavBar';
import './RegisterTeacher.css';

interface Class {
    _id: string;
    className: string;
    section: string;
    academicYear: string;
}

interface TeacherFormData {
    teacherId: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    assignedClassId: string;
    password: string;
}

function RegisterTeacher() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [formData, setFormData] = useState<TeacherFormData>({
        teacherId: '',
        name: '',
        email: '',
        phone: '',
        subject: '',
        assignedClassId: '',
        password: 'password123',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes');
            setClasses(response.data);
        } catch (err) {
            console.error('Failed to fetch classes:', err);
            setError('Failed to load classes');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                setError('Image must be less than 5MB');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted!', formData);

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            console.log('Registering teacher...');
            // Use combined register endpoint
            const response = await api.post('/teachers/register', {
                teacherId: formData.teacherId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                subject: formData.subject,
                assignedClassId: formData.assignedClassId || undefined,
                password: formData.password,
            });

            if (selectedFile && response.data.teacher?._id) {
                const uploadData = new FormData();
                uploadData.append('image', selectedFile);
                uploadData.append('teacherId', response.data.teacher._id);

                await api.post('/teachers/upload-image', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            console.log('Teacher registered successfully:', response.data);
            setSuccess(`✅ Teacher ${formData.name} registered successfully! Login ID: ${formData.teacherId}, Password: ${formData.password}`);

            // Reset form
            setFormData({
                teacherId: '',
                name: '',
                email: '',
                phone: '',
                subject: '',
                assignedClassId: '',
                password: 'password123',
            });
            setSelectedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);

            // Auto-redirect after 5 seconds
            setTimeout(() => navigate('/admin/teachers'), 5000);

        } catch (err: any) {
            console.error('Registration error:', err);
            console.error('Error response:', err.response?.data);
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
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/dashboard" backLabel="← Dashboard" />

            <div className="register-content">
                <div className="register-card">
                    <div className="register-header">
                        <h1>👨‍🏫 Register New Teacher</h1>
                        <p>Fill in the details below to create a new teacher account</p>
                    </div>

                    {error && <div className="alert alert-error">❌ {error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <form onSubmit={handleSubmit} className="register-form">
                        {/* Teacher Information */}
                        <div className="form-section">
                            <h3>Teacher Information</h3>
                            
                            <div className="profile-upload-section" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div 
                                    className="profile-preview" 
                                    style={{ 
                                        width: '100px', 
                                        height: '100px', 
                                        borderRadius: '50%', 
                                        background: previewUrl ? `url(${previewUrl}) center/cover` : 'var(--gray-200)',
                                        border: '4px solid white',
                                        boxShadow: 'var(--shadow-sm)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {!previewUrl && <span style={{ fontSize: '2rem' }}>👨‍🏫</span>}
                                </div>
                                <div className="upload-controls">
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                                        Upload Profile Picture
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '8px', marginBottom: 0 }}>Optional. Max size: 5MB</p>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Teacher ID *</label>
                                    <input
                                        type="text"
                                        name="teacherId"
                                        value={formData.teacherId}
                                        onChange={handleChange}
                                        placeholder="e.g., TCH002"
                                        required
                                    />
                                    <small>Unique identifier for the teacher</small>
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
                                        placeholder="teacher@gmail.com"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 1234567890"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Subject/Specialization</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="e.g., Mathematics, Science"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Class Assignment */}
                        <div className="form-section">
                            <h3>Class Assignment (Optional - Can Assign Later)</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Assign to Class (Optional)</label>
                                    <select
                                        name="assignedClassId"
                                        value={formData.assignedClassId}
                                        onChange={handleChange}
                                    >
                                        <option value="">-- Skip for Now --</option>
                                        {classes.map((cls) => (
                                            <option key={cls._id} value={cls._id}>
                                                Class {cls.className} - Section {cls.section} ({cls.academicYear})
                                            </option>
                                        ))}
                                    </select>
                                    <small>You can assign or change class assignment later from Teachers page</small>
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
                                    <small>Teacher can change this after first login</small>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="form-actions">
                            <button type="button" onClick={() => navigate('/admin/teachers')} className="btn btn-cancel">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? '⏳ Registering...' : '✅ Register Teacher'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RegisterTeacher;
