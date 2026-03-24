import { useState } from 'react';
import { forgotPasswordService } from '../services/api';
import '../styles/forgot-password.css';

type Step = 'enter-id' | 'enter-otp' | 'set-password' | 'done';

interface ForgotPasswordProps {
    onClose: () => void;
}

export default function ForgotPassword({ onClose }: ForgotPasswordProps) {
    const [step, setStep] = useState<Step>('enter-id');
    const [userId, setUserId] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await forgotPasswordService.sendOtp(userId.trim());
            setMaskedEmail(res.email);
            setStep('enter-otp');
        } catch (err: any) {
            setError(err.response?.data?.message || 'User not found.');
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await forgotPasswordService.verifyOtp(userId.trim(), otp.trim());
            setResetToken(res.token);
            setStep('set-password');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired OTP.');
        } finally { setLoading(false); }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setError('');
        setLoading(true);
        try {
            await forgotPasswordService.resetPassword(resetToken, newPassword);
            setStep('done');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Reset failed.');
        } finally { setLoading(false); }
    };

    return (
        <div className="fp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="fp-modal">
                <button className="fp-close" onClick={onClose}>✕</button>

                {step === 'enter-id' && (
                    <form onSubmit={handleSendOtp} className="fp-form">
                        <div className="fp-icon">🔑</div>
                        <h2>Forgot Password</h2>
                        <p>Enter your User ID or email to receive an OTP.</p>
                        <input
                            type="text"
                            placeholder="User ID or Email"
                            value={userId}
                            onChange={e => setUserId(e.target.value)}
                            required autoFocus
                        />
                        {error && <p className="fp-error">{error}</p>}
                        <button type="submit" className="fp-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {step === 'enter-otp' && (
                    <form onSubmit={handleVerifyOtp} className="fp-form">
                        <div className="fp-icon">📧</div>
                        <h2>Check Your Email</h2>
                        <p>OTP sent to <strong>{maskedEmail}</strong>. Valid for 10 minutes.</p>
                        <input
                            type="text"
                            placeholder="6-digit OTP"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            maxLength={6}
                            required autoFocus
                        />
                        {error && <p className="fp-error">{error}</p>}
                        <button type="submit" className="fp-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button type="button" className="fp-link" onClick={() => setStep('enter-id')}>← Try again</button>
                    </form>
                )}

                {step === 'set-password' && (
                    <form onSubmit={handleResetPassword} className="fp-form">
                        <div className="fp-icon">🔒</div>
                        <h2>Set New Password</h2>
                        <input
                            type="password"
                            placeholder="New Password (min 6 chars)"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required autoFocus
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                        />
                        {error && <p className="fp-error">{error}</p>}
                        <button type="submit" className="fp-btn" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                {step === 'done' && (
                    <div className="fp-form fp-done">
                        <div className="fp-icon">✅</div>
                        <h2>Password Reset!</h2>
                        <p>Your password has been updated. You can now log in.</p>
                        <button className="fp-btn" onClick={onClose}>Go to Login</button>
                    </div>
                )}
            </div>
        </div>
    );
}
