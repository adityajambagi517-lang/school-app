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
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        admin: true,
        teacher: false,
        student: false
    });
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

    const handleDeleteUser = async (id: string, name: string) => {
        if (!window.confirm(`⚠️ Are you sure you want to PERMANENTLY delete user ${name}? This will NOT delete associated profile records if any.`)) {
            return;
        }

        try {
            await usersService.delete(id);
            setUsers(users.filter(u => u._id !== id));
            setSuccess(`✅ User ${name} deleted successfully`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete user');
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const admins = filteredUsers.filter(u => u.role === 'admin');
    const teachers = filteredUsers.filter(u => u.role === 'teacher');
    const students = filteredUsers.filter(u => u.role === 'student');

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
                            ➕ Create Admin
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-error">❌ {error}</div>}
                {success && <div className="alert alert-success">✅ {success}</div>}

                {/* Create Admin Modal */}
                {showCreateModal && (
                    <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setShowCreateModal(false); }}>
                        <div className="modal-content">
                            <h2>Create New Administrator</h2>
                            <form onSubmit={handleCreateUser} className="form-grid">
                                <div className="form-group">
                                    <label>Admin User ID *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={newUser.userId}
                                        onChange={e => setNewUser({...newUser, userId: e.target.value})}
                                        placeholder="e.g. admin_jane"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Full Name *</label>
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
                                        label="Login Password *"
                                        required
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Complete Creation</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="user-groups-container">
                    {loading ? (
                        <div className="loading-state">Loading users...</div>
                    ) : (
                        <>
                            {/* Administrators Group */}
                            <div className={`user-group ${expandedGroups.admin ? 'expanded' : ''}`}>
                                <div className="group-header" onClick={() => toggleGroup('admin')}>
                                    <h3>👨‍💼 Administrators ({admins.length})</h3>
                                    <span className="expand-icon">{expandedGroups.admin ? '−' : '+'}</span>
                                </div>
                                {expandedGroups.admin && (
                                    <div className="group-content">
                                        <UserTable users={admins} onResetPassword={handleResetPassword} onToggleStatus={handleToggleStatus} onDeleteUser={handleDeleteUser} />
                                    </div>
                                )}
                            </div>

                            {/* Teachers Group */}
                            <div className={`user-group ${expandedGroups.teacher ? 'expanded' : ''}`}>
                                <div className="group-header" onClick={() => toggleGroup('teacher')}>
                                    <h3>👨‍🏫 Teachers ({teachers.length})</h3>
                                    <span className="expand-icon">{expandedGroups.teacher ? '−' : '+'}</span>
                                </div>
                                {expandedGroups.teacher && (
                                    <div className="group-content">
                                        <UserTable users={teachers} onResetPassword={handleResetPassword} onToggleStatus={handleToggleStatus} onDeleteUser={handleDeleteUser} />
                                    </div>
                                )}
                            </div>

                            {/* Students Group */}
                            <div className={`user-group ${expandedGroups.student ? 'expanded' : ''}`}>
                                <div className="group-header" onClick={() => toggleGroup('student')}>
                                    <h3>👥 Students ({students.length})</h3>
                                    <span className="expand-icon">{expandedGroups.student ? '−' : '+'}</span>
                                </div>
                                {expandedGroups.student && (
                                    <div className="group-content">
                                        <UserTable users={students} onResetPassword={handleResetPassword} onToggleStatus={handleToggleStatus} onDeleteUser={handleDeleteUser} />
                                    </div>
                                )}
                            </div>

                            {filteredUsers.length === 0 && (
                                <div className="empty-state">No users found matching your search.</div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-component for User Table
function UserTable({ users, onResetPassword, onToggleStatus, onDeleteUser }: { 
    users: User[], 
    onResetPassword: (id: string, name: string) => void, 
    onToggleStatus: (id: string, name: string, status: boolean) => void,
    onDeleteUser: (id: string, name: string) => void
}) {
    if (users.length === 0) return <div className="empty-group">No users in this category.</div>;
    
    return (
        <div className="users-table-container">
            <table className="users-table">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
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
                                <span className={`status-badge status-${user.isActive ? 'active' : 'inactive'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="actions-cell">
                                <button 
                                    onClick={() => onResetPassword(user._id, user.name)}
                                    className="btn-action btn-reset"
                                    title="Reset to default password"
                                >
                                    🔑 Reset
                                </button>
                                <button 
                                    onClick={() => onToggleStatus(user._id, user.name, user.isActive)}
                                    className={`btn-action ${user.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                                >
                                    {user.isActive ? '🚫 Deactivate' : '✔️ Activate'}
                                </button>
                                <button 
                                    onClick={() => onDeleteUser(user._id, user.name)}
                                    className="btn-action btn-delete"
                                    title="Delete User Permanently"
                                >
                                    🗑️ Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default UserManagement;
