import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if already logged in
        const user = authService.getCurrentUser();
        if (user) {
            redirectToDashboard(user.role);
        }
    }, []);

    const redirectToDashboard = (role: string) => {
        if (role === 'admin') {
            navigate('/admin/dashboard');
        } else if (role === 'teacher') {
            navigate('/teacher/dashboard');
        } else if (role === 'student') {
            navigate('/student/dashboard');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await authService.login(userId, password);
            redirectToDashboard(data.user.role);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>School Management System</h1>
                    <p>Sign in to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="userId">User ID</label>
                        <input
                            type="text"
                            id="userId"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Enter your user ID"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="demo-credentials">
                        <strong>Demo Credentials:</strong><br />
                        Admin: admin / password123<br />
                        Teacher: TCH001 / password123<br />
                        Student: STU001 / password123
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
