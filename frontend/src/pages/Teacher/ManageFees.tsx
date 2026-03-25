import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, feesService, studentsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import '../Teacher/Dashboard.css';

interface Student {
    _id: string;
    studentId: string;
    name: string;
}

function ManageFees() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(authService.getCurrentUser());
    const [students, setStudents] = useState<Student[]>([]);
    const [classFees, setClassFees] = useState<any[]>([]);
    const [paymentAmount, setPaymentAmount] = useState<{[key: string]: string}>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [editingId, setEditingId] = useState<string | null>(null);

    const initialFormState = {
        studentId: '',
        academicYear: new Date().getFullYear().toString(),
        termName: '',
        amount: '',
        paidAmount: '',
        dueDate: '',
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const fullUser = await authService.getMe();
            setUser(fullUser);
            if (fullUser.assignedClassId) {
                await loadStudents(fullUser.assignedClassId);
            } else {
                setMessage({ type: 'error', text: 'No class assigned to your account. Please contact Admin.' });
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            setLoading(false);
        }
    };

    const loadStudents = async (classId: string) => {
        try {
            const [data, feesData] = await Promise.all([
                studentsService.getByClass(classId),
                feesService.getByClass(classId)
            ]);
            setStudents(data);
            setClassFees(feesData);
            setLoading(false);
        } catch (error: any) {
            console.error('Error loading students:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load students. Ensure you are assigned to a class.' });
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const payload = {
                studentId: formData.studentId,
                academicYear: formData.academicYear,
                termName: formData.termName,
                amount: Number(formData.amount),
                paidAmount: formData.paidAmount ? Number(formData.paidAmount) : 0,
                dueDate: formData.dueDate,
            };

            if (editingId) {
                await feesService.update(editingId, payload);
                setMessage({ type: 'success', text: 'Draft fee updated successfully!' });
                setEditingId(null);
            } else {
                await feesService.create(payload);
                setMessage({ type: 'success', text: 'Fee record created successfully! (Draft saved)' });
            }

            if (user.assignedClassId) await loadStudents(user.assignedClassId); // Refresh fees list
            setFormData(prev => ({ ...initialFormState, studentId: prev.studentId }));
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save fee record' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecordPayment = async (feeId: string) => {
        const amountStr = paymentAmount[feeId];
        if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid payment amount' });
            return;
        }
        
        try {
            setSubmitting(true);
            await feesService.recordPayment(feeId, Number(amountStr));
            setMessage({ type: 'success', text: `Payment of ₹${amountStr} recorded successfully!` });
            setPaymentAmount({ ...paymentAmount, [feeId]: '' });
            if (user.assignedClassId) await loadStudents(user.assignedClassId); // Refresh to get updated amounts
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to record payment' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditDraft = (fee: any) => {
        setEditingId(fee._id);
        setFormData({
            studentId: fee.studentId?._id || fee.studentId,
            academicYear: fee.academicYear,
            termName: fee.termName,
            amount: fee.amount.toString(),
            paidAmount: fee.paidAmount ? fee.paidAmount.toString() : '',
            dueDate: new Date(fee.dueDate).toISOString().split('T')[0],
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteDraft = async (id: string) => {
        if (!confirm('Are you sure you want to delete this draft?')) return;
        try {
            await feesService.delete(id);
            setMessage({ type: 'success', text: 'Draft deleted.' });
            if (user.assignedClassId) await loadStudents(user.assignedClassId);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to delete draft.' });
        }
    };

    const handleSubmitDraft = async (id: string) => {
        try {
            await feesService.submit(id);
            setMessage({ type: 'success', text: 'Fee submitted for Admin approval!' });
            if (user.assignedClassId) await loadStudents(user.assignedClassId);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to submit fee.' });
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>💰 Manage Fees</h1>
                    <p>Create and manage student fee records</p>
                </div>

                {message.text && (
                    <div className={`message message-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form-container">
                    <div className="form-group">
                        <label>Student *</label>
                        <select
                            value={formData.studentId}
                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                            required
                            className="form-input"
                        >
                            <option value="">Select Student</option>
                            {students.map(student => (
                                <option key={student._id} value={student._id}>
                                    {student.studentId} - {student.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Academic Year *</label>
                            <input
                                type="text"
                                value={formData.academicYear}
                                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                placeholder="e.g., 2024"
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Term *</label>
                            <select
                                value={formData.termName}
                                onChange={(e) => setFormData({ ...formData, termName: e.target.value })}
                                required
                                className="form-input"
                            >
                                <option value="">Select Term</option>
                                <option value="Term 1">Term 1</option>
                                <option value="Term 2">Term 2</option>
                                <option value="Term 3">Term 3</option>
                                <option value="Annual">Annual</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Amount (₹) *</label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="e.g., 10000"
                                min="1"
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Paid Upfront (₹)</label>
                            <input
                                type="number"
                                value={formData.paidAmount}
                                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                                placeholder="e.g., 2000 (Optional)"
                                min="0"
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Due Date *</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            required
                            className="form-input"
                            style={{ width: '100%', maxWidth: '300px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : (editingId ? 'Update Draft' : 'Create Fee Record')}
                        </button>
                        {editingId && (
                            <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setFormData(initialFormState); }}>
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>

                <div className="info-box">
                    <p>ℹ️ Fee records are saved as drafts. Submit them for admin approval to publish to students.</p>
                </div>

                {formData.studentId && (
                    <div style={{ marginTop: '2rem' }}>
                        <div className="section-header">
                            <h2 className="section-title">Student Fee Records</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            {classFees.filter(f => (f.studentId?._id || f.studentId) === formData.studentId).length === 0 ? (
                                <p style={{ color: '#666' }}>No fees found for this student.</p>
                            ) : (
                                classFees.filter(f => (f.studentId?._id || f.studentId) === formData.studentId).map(fee => {
                                    const remaining = fee.amount - (fee.paidAmount || 0);
                                    return (
                                        <div key={fee._id} className="activity-card" style={{ padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>{fee.termName} ({fee.academicYear})</h3>
                                                <span className={`badge ${fee.status === 'PAID' ? 'badge-success' : (fee.status === 'PUBLISHED' ? 'badge-warning' : (fee.status === 'DRAFT' ? 'badge-danger' : 'badge-info'))}`} style={{ textTransform: 'uppercase' }}>
                                                    {fee.status === 'PUBLISHED' ? 'PENDING' : fee.status}
                                                </span>
                                            </div>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.95rem', color: '#4a5568', background: '#f7fafc', padding: '0.75rem', borderRadius: '8px' }}>
                                                <div><strong>Total:</strong> ₹{fee.amount.toLocaleString()}</div>
                                                <div style={{ color: '#2f855a' }}><strong>Paid:</strong> ₹{(fee.paidAmount || 0).toLocaleString()}</div>
                                                <div style={{ color: remaining > 0 ? '#e53e3e' : '#2f855a' }}><strong>Remaining:</strong> ₹{remaining.toLocaleString()}</div>
                                            </div>
                                            
                                            {fee.status === 'DRAFT' && (
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                                    <button type="button" className="btn btn-primary" onClick={() => handleSubmitDraft(fee._id)} style={{ flex: 1 }}>Submit for Approval</button>
                                                    <button type="button" className="btn btn-secondary" onClick={() => handleEditDraft(fee)}>✏️ Edit</button>
                                                    <button type="button" className="btn btn-danger" onClick={() => handleDeleteDraft(fee._id)}>🗑️</button>
                                                </div>
                                            )}

                                            {(fee.status === 'PUBLISHED' && remaining > 0) && (
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                    <input 
                                                        type="number" 
                                                        placeholder="Enter payment amount" 
                                                        className="form-input" 
                                                        style={{ flex: 1, margin: 0 }}
                                                        value={paymentAmount[fee._id] || ''}
                                                        onChange={e => setPaymentAmount({...paymentAmount, [fee._id]: e.target.value})}
                                                        max={remaining}
                                                        min="1"
                                                    />
                                                    <button 
                                                        type="button"
                                                        className="btn btn-primary" 
                                                        onClick={() => handleRecordPayment(fee._id)}
                                                        disabled={submitting || !paymentAmount[fee._id]}
                                                        style={{ whiteSpace: 'nowrap' }}
                                                    >
                                                        Record Payment
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManageFees;
