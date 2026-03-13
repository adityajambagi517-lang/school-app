import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, usersService } from '../../services/api';
import NavBar from '../../components/NavBar';
import PasswordInput from '../../components/Common/PasswordInput';
import './UserManagement.css';

interface User {
    _id: string;
    userId: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
}

function UserManagement() {
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({
        userId: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        role: 'admin'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await usersService.getAll();
            setUsers(data.users);
        } catch (err: any) {
            setError('Failed to fetch users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await usersService.create(newUser);
            setSuccess(`User ${newUser.name} created successfully!`);
            setShowCreateModal(false);
            setNewUser({ userId: '', password: '', name: '', email: '', phone: '', role: 'admin' });
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create user');
        }
    };

    const handleResetPassword = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to reset the password for ${name}? The new password will be 'password123'.`)) {
            return;
        }

        try {
            await usersService.resetPassword(id);
            setSuccess(`Password reset successfully for ${name}`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to reset password');
        }
    };

    const handleToggleStatus = async (id: string, name: string, currentStatus: boolean) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} the account for ${name}?`)) {
            return;
        }

        try {
            await usersService.toggleStatus(id);
            setUsers(users.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
            setSuccess(`User ${name} ${currentStatus ? 'deactivated' : 'activated'} successfully`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update user status');
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-container">
            <NavBar 
                role="admin" 
                userName={currentUser?.name} 
                onLogout={handleLogout} 
                backTo="/admin/dashboard"
                backLabel="← Dashboard"
            />

            <div className="admin-content">
                <div className="page-header">
                    <div>
                        <h1>👥 User Management</h1>
                        <p>Manage credentials and account status for all users</p>
                    </div>
                    <div className="header-actions">
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                        >
                            ➕ Create User
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-error">❌ {error}</div>}
                {success && <div className="alert alert-success">✅ {success}</div>}

                {/* Create User Modal */}
                {showCreateModal && (
                    <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setShowCreateModal(false); }}>
                        <div className="modal-content">
                            <h2>Create New User</h2>
                            <form onSubmit={handleCreateUser} className="form-grid">
                                <div className="form-group">
                                    <label>User ID *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={newUser.userId}
                                        onChange={e => setNewUser({...newUser, userId: e.target.value})}
                                        placeholder="e.g. admin2"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={newUser.name}
                                        onChange={e => setNewUser({...newUser, name: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={newUser.email}
                                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input 
                                        type="tel" 
                                        value={newUser.phone}
                                        onChange={e => setNewUser({...newUser, phone: e.target.value})}
                                        placeholder="e.g. 9999999999"
                                    />
                                </div>
                                <div className="form-group">
                                    <PasswordInput
                                        label="Password *"
                                        required
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <select 
                                        value={newUser.role}
                                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                                    >
                                        <option value="admin">Administrator</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="student">Student</option>
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="users-table-container">
                    {loading ? (
                        <div className="loading-state">Loading users...</div>
                    ) : (
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user._id}>
                                        <td><strong>{user.userId}</strong></td>
                                        <td>{user.name}</td>
                                        <td>
                                            <div className="contact-info">
                                                <span className="contact-email">{user.email}</span>
                                                {user.phone && <span className="contact-phone">{user.phone}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge role-${user.role}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${user.isActive ? 'active' : 'inactive'}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button 
                                                onClick={() => handleResetPassword(user._id, user.name)}
                                                className="btn-action btn-reset"
                                                title="Reset to default password"
                                            >
                                                🔑 Reset
                                            </button>
                                            <button 
                                                onClick={() => handleToggleStatus(user._id, user.name, user.isActive)}
                                                className={`btn-action ${user.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                                            >
                                                {user.isActive ? '🚫 Deactivate' : '✔️ Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="empty-state">No users found matching your search.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserManagement;
