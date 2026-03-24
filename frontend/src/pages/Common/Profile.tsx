import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './Profile.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Camera/Upload state
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        setFormData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || ''
        });
        setLoading(false);
    }, [navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        // Detect what changed
        const changed = (
            formData.name  !== (user?.name  || '') ||
            formData.email !== (user?.email || '') ||
            formData.phone !== (user?.phone || '')
        );

        if (!changed) {
            setSuccess('No changes were made.');
            setTimeout(() => setSuccess(''), 3000);
            setSaving(false);
            return;
        }

        try {
            const updatedUser = await authService.updateProfile(formData);
            setUser(updatedUser);
            setSuccess('Profile information updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setSaving(true);
            await authService.uploadProfilePicture(file);
            setSuccess('Profile picture updated!');
            const updatedUser = authService.getCurrentUser();
            setUser(updatedUser);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError('Failed to upload picture');
        } finally {
            setSaving(false);
        }
    };

    // Camera functions
    const startCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError('Could not access camera');
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setShowCamera(false);
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context?.drawImage(videoRef.current, 0, 0);
            
            canvasRef.current.toBlob(async (blob) => {
                if (blob) {
                    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
                    try {
                        setSaving(true);
                        await authService.uploadProfilePicture(file);
                        setSuccess('Photo captured and uploaded!');
                        const updatedUser = authService.getCurrentUser();
                        setUser(updatedUser);
                        stopCamera();
                        setTimeout(() => setSuccess(''), 3000);
                    } catch (err) {
                        setError('Failed to upload photo');
                    } finally {
                        setSaving(false);
                    }
                }
            }, 'image/jpeg');
        }
    };

    if (loading) return <div className="loading-container">Loading...</div>;

    const profilePicUrl = user?.profilePicture 
        ? (user.profilePicture.startsWith('http') || user.profilePicture.startsWith('data:') ? user.profilePicture : `${API_URL}${user.profilePicture}`)
        : '/default-avatar.png';

    return (
        <div className="profile-page-container">
            <NavBar 
                role={user?.role} 
                userName={user?.name} 
                onLogout={() => { authService.logout(); navigate('/login'); }} 
                backTo={`/${user?.role}/dashboard`}
                backLabel="← Back"
            />

            <div className="profile-content">
                <div className="profile-card">
                    <div className="profile-header">
                        <h1>👤 My Profile</h1>
                        <p>Manage your personal information and profile picture</p>
                    </div>

                    {error && <div className="alert alert-error">❌ {error}</div>}
                    {success && <div className="alert alert-success">✅ {success}</div>}

                    <div className="profile-main">
                        <div className="profile-picture-section">
                            <div className="profile-image-container">
                                <img src={profilePicUrl} alt="Profile" className="profile-image-large" />
                                {saving && <div className="image-overlay-loading">...</div>}
                            </div>
                            
                            <div className="profile-image-actions">
                                <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                                    📁 Upload Photo
                                </button>
                                <button className="btn btn-secondary" onClick={startCamera}>
                                    📷 Take Photo
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    accept="image/*" 
                                    style={{ display: 'none' }} 
                                />
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} className="profile-form">
                            <div className="form-group">
                                <label>User ID (Login ID)</label>
                                <input type="text" value={user?.userId} disabled className="input-disabled" />
                            </div>
                            
                            <div className="form-group">
                                <label>Role</label>
                                <span className={`badge badge-${user?.role}`}>{user?.role}</span>
                            </div>

                            <div className="form-group">
                                <label>Full Name *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address *</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={handleInputChange} 
                                    placeholder="e.g. 9999999999"
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-save" disabled={saving}>
                                {saving ? 'Saving...' : '💾 Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <div className="modal-overlay">
                    <div className="modal-content camera-modal">
                        <h2>Take a Photo</h2>
                        <div className="camera-view">
                            <video ref={videoRef} autoPlay playsInline muted />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={stopCamera}>Cancel</button>
                            <button className="btn btn-primary" onClick={takePhoto}>Capture</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;
