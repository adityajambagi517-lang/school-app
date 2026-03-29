import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import PasswordInput from './Common/PasswordInput';
import NavBar from './NavBar';
import '../pages/Teacher/Dashboard.css';

interface ChangePasswordProps {
    role: 'teacher' | 'student' | 'admin';
}

function ChangePassword({ role }: ChangePasswordProps) {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
            return;
        }

        setSubmitting(true);

        try {
            await authService.changePassword(formData.currentPassword, formData.newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => navigate(`/${role}/dashboard`), 2000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to change password'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="dash-root">
             <NavBar
                role={role}
                userName={user?.name || 'User'}
                onLogout={handleLogout}
                backTo={`/${role}/dashboard`}
                backLabel="← Dashboard"
            />
            
            <div className="dash-scroll">
                <div className="page-header">
                    <h1>🔐 Change Password</h1>
                    <p>Update your account password</p>
                </div>

                {message.text && (
                    <div className={`message message-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form-container" style={{ maxWidth: '500px' }}>
                    <PasswordInput
                        label="Current Password *"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        required
                        placeholder="Enter current password"
                    />

                    <PasswordInput
                        label="New Password *"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        required
                        minLength={6}
                        placeholder="Enter new password (min. 6 characters)"
                    />

                    <PasswordInput
                        label="Confirm New Password *"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        minLength={6}
                        placeholder="Re-enter new password"
                    />

                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Changing Password...' : 'Change Password'}
                    </button>
                </form>

                <div className="info-box" style={{ maxWidth: '500px' }}>
                    <p>💡 <strong>Password Tips:</strong></p>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        <li>Use at least 6 characters</li>
                        <li>Include a mix of letters and numbers</li>
                        <li>Don't use easily guessable information</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ChangePassword;
