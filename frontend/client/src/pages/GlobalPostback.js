import React, { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'https://trackierpanel.com';

const GlobalPostback = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/postback`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUrl(data.url || '');
            }
        } catch (error) {
            console.error('Failed to fetch postback config:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/postback`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Global Postback URL updated successfully' });
            } else {
                setMessage({ type: 'error', text: 'Failed to update URL' });
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card-header">
                <h3>Global Postback</h3>
                <span className="subtitle">Configure the default postback URL for all conversions</span>
            </div>
            
            <div style={{ padding: '2rem' }}>
                {message.text && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                        color: message.type === 'error' ? '#ef4444' : '#166534',
                        border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`
                    }}>
                        {message.text}
                    </div>
                )}

                <div className="info-box" style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', borderLeft: '4px solid #3b82f6' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '0.95rem' }}>ℹ️ How it works</h4>
                    <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        This Global Postback URL will be fired for every successful conversion recorded in the system. 
                        Click on a macro below to add it to your URL.
                    </p>
                    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {['{click_id}', '{payout}', '{camp_id}', '{publisher_id}', '{source}'].map(macro => (
                            <span 
                                key={macro}
                                onClick={() => setUrl(prev => prev + macro)}
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #bfdbfe',
                                    color: '#2563eb',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '16px',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                {macro}
                            </span>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Global Postback URL (Outbound)</label>
                        <input 
                            type="url" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/postback?clickid={click_id}"
                            style={{ 
                                width: '100%', 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                border: '1px solid #cbd5e1',
                                fontSize: '1rem',
                                color: '#334155'
                            }}
                            required 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            background: '#4f46e5',
                            color: 'white',
                            padding: '0.75rem 2rem',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                </form>

                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#334155' }}>Your Tracking Endpoint (Inbound)</h4>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Provide this URL to your publishers to fire conversions back to your system.
                    </p>
                    <div style={{ 
                        background: '#1e293b', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        color: '#fbbf24', 
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                    }}>
                        {BACKEND_URL}/api/track/conversion?click_id=CLICK_ID&payout=AMOUNT
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalPostback;
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            Your Global Postback URL (Outbound)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="url" 
                                className="pub-input"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://your-tracker.com/postback?clickid={click_id}&payout={payout}"
                                style={{ 
                                    width: '100%', 
                                    padding: '14px 16px', 
                                    fontSize: '1rem',
                                    backgroundColor: '#fcfcfc'
                                }}
                                required 
                            />
                        </div>
                        <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Example: <code>https://webhook.site/test?cid={"{"}click_id{"}"}&amt={"{"}payout{"}"}</code>
                        </p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            background: 'var(--primary)',
                            color: 'white',
                            padding: '12px 28px',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'var(--transition)',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                        }}
                    >
                        {loading ? 'Saving Changes...' : <><Save size={18} /> Save Configuration</>}
                    </button>
                </form>

                <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)' }}>Your Inbound Tracking Landing</h4>
                        <button 
                            onClick={handleCopy}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: copied ? '#dcfce7' : '#f1f5f9',
                                color: copied ? '#166534' : 'var(--text-main)',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {copied ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy URL</>}
                        </button>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.5' }}>
                        If you are building your own custom tracking, use this endpoint to fire conversions back to Trackier Panel.
                    </p>
                    <div style={{ 
                        background: '#0f172a', 
                        padding: '16px 20px', 
                        borderRadius: '12px', 
                        color: '#38bdf8', 
                        fontFamily: 'JetBrains Mono, Fira Code, monospace',
                        fontSize: '0.85rem',
                        wordBreak: 'break-all',
                        border: '1px solid #1e293b',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        <span style={{ color: '#94a3b8' }}>GET</span> {BACKEND_URL}/api/track/conversion?click_id=<span style={{ color: '#fbbf24' }}>CLICK_ID</span>&payout=<span style={{ color: '#fbbf24' }}>AMOUNT</span>{securityToken ? <>&security_token=<span style={{ color: '#fbbf24' }}>{securityToken}</span></> : ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalPostback;
