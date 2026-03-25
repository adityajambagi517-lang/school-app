import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportService, authService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './ReportProblem.css';

const CATEGORIES = [
    { value: 'password_issue', label: '🔑 Password Issue' },
    { value: 'bug',            label: '🐛 Bug / Error' },
    { value: 'other',          label: '💬 Other' },
];

export default function ReportProblem() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('other');
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const u = authService.getCurrentUser();
        if (!u) navigate('/login');
        setUser(u);
    }, [navigate]);

    const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) { setError('Screenshot must be under 3MB'); return; }
        const reader = new FileReader();
        reader.onload = () => setScreenshot(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!title.trim() || !description.trim()) { setError('Please fill in all required fields.'); return; }
        setLoading(true);
        try {
            await supportService.create({
                title: title.trim(),
                description: description.trim(),
                category,
                screenshot: screenshot || undefined,
            });
            setSuccess('✅ Your report has been submitted. The admin will review it shortly.');
            setTitle(''); setDescription(''); setCategory('other'); setScreenshot(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit report.');
        } finally { setLoading(false); }
    };

    return (
        <div className="report-page">
            <NavBar 
                role={user?.role} 
                userName={user?.name} 
                onLogout={() => { authService.logout(); navigate('/login'); }} 
                backTo={`/${user?.role}/dashboard`}
                backLabel="← Back"
            />
            <div className="report-card">
                <div className="report-header">
                    <h1>🛠️ Report a Problem</h1>
                    <p>Describe your issue and the admin will be notified immediately.</p>
                </div>

                <form onSubmit={handleSubmit} className="report-form">
                    <div className="form-group">
                        <label>Category *</label>
                        <div className="category-pills">
                            {CATEGORIES.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    className={`pill${category === c.value ? ' active' : ''}`}
                                    onClick={() => setCategory(c.value)}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            placeholder="Brief summary of the issue"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description *</label>
                        <textarea
                            placeholder="Describe the problem in detail — what happened, what you expected, and any steps to reproduce..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={5}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Screenshot (optional)</label>
                        <div className="screenshot-area" onClick={() => fileRef.current?.click()}>
                            {screenshot ? (
                                <div className="screenshot-preview">
                                    <img src={screenshot} alt="screenshot preview" />
                                    <button type="button" className="remove-screenshot" onClick={(e) => { e.stopPropagation(); setScreenshot(null); }}>✕</button>
                                </div>
                            ) : (
                                <div className="screenshot-placeholder">
                                    <span>📷</span>
                                    <p>Click to upload a screenshot (max 3MB)</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} style={{ display: 'none' }} />
                    </div>

                    {error && <div className="report-error">{error}</div>}
                    {success && <div className="report-success">{success}</div>}

                    <button type="submit" className="report-submit" disabled={loading}>
                        {loading ? 'Submitting...' : '🚀 Submit Report'}
                    </button>
                </form>
            </div>
        </div>
    );
}
