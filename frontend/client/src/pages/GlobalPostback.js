import React, { useState, useEffect } from 'react';
import { Globe, Info, Save, Copy, CheckCircle2, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://trackierpanel.com';

const GlobalPostback = () => {
    const [url, setUrl] = useState('');
    const [securityToken, setSecurityToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [copied, setCopied] = useState(false);

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
                setSecurityToken(data.securityToken || '');
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
                setMessage({ type: 'success', text: 'Postback configuration saved successfully!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            } else {
                setMessage({ type: 'error', text: 'Failed to save configuration. Please try again.' });
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage({ type: 'error', text: 'A network error occurred. Please check your connection.' });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateToken = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/postback/generate-token`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSecurityToken(data.securityToken);
                setMessage({ type: 'success', text: 'Security token generated successfully!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: 'Failed to generate token. Contact admin.' });
            }
        } catch (error) {
            console.error('Token generation error:', error);
            setMessage({ type: 'error', text: 'A network error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        const inboundUrl = `${BACKEND_URL}/api/track/conversion?click_id=CLICK_ID&payout=AMOUNT${securityToken ? `&security_token=${securityToken}` : ''}`;
        navigator.clipboard.writeText(inboundUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="pub-table-card" style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            <div className="pub-table-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Globe size={20} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Postback & Security Settings</h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Manage your postback URL and secure your tracking endpoints.
                </p>
            </div>
            
            <div style={{ padding: '32px' }}>
                {message.text && (
                    <div style={{
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                        color: message.type === 'error' ? '#991b1b' : '#166534',
                        border: `1px solid ${message.type === 'error' ? '#fee2e2' : '#dcfce7'}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                        {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                        {message.text}
                    </div>
                )}

                {/* Tracking Security Section */}
                <div style={{ 
                    background: '#f8fafc', 
                    padding: '24px', 
                    borderRadius: '20px', 
                    marginBottom: '32px', 
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <CheckCircle2 size={18} color="var(--success)" />
                            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '800' }}>Inbound Security Token</h4>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                            This token is required in your Tracking Landing URL to authenticate conversion requests.
                        </p>
                    </div>

                    {securityToken ? (
                        <div style={{ 
                            background: 'white', 
                            padding: '12px 24px', 
                            borderRadius: '12px', 
                            border: '1px solid var(--border)',
                            fontFamily: 'JetBrains Mono, Fira Code, monospace',
                            fontWeight: '800',
                            color: 'var(--primary)',
                            fontSize: '1.15rem',
                            letterSpacing: '1px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            minWidth: '160px',
                            textAlign: 'center'
                        }}>
                            {securityToken}
                        </div>
                    ) : (
                        <button 
                            onClick={handleGenerateToken}
                            disabled={loading}
                            style={{
                                background: 'white',
                                color: 'var(--primary)',
                                border: '2px dashed var(--primary-light)',
                                padding: '10px 24px',
                                borderRadius: '12px',
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => { e.target.style.background = '#f5f7ff'; e.target.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.transform = 'translateY(0)'; }}
                        >
                            <Save size={16} /> {loading ? 'Generating...' : 'Generate New Token'}
                        </button>
                    )}
                </div>

                <div style={{ 
                    background: 'linear-gradient(to right, #eff6ff, #f8fafc)', 
                    padding: '20px', 
                    borderRadius: '16px', 
                    marginBottom: '32px', 
                    border: '1px solid #dbeafe' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Info size={18} color="#2563eb" />
                        <h4 style={{ margin: 0, color: '#1e40af', fontSize: '1rem', fontWeight: '700' }}>How it works</h4>
                    </div>
                    <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        When a conversion is recorded for your traffic, our system will automatically fire this URL.
                        Use the <strong>Macros</strong> below to dynamicially insert conversion details into your URL.
                    </p>
                    <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['{click_id}', '{payout}', '{camp_id}', '{publisher_id}', '{source}'].map(macro => (
                            <button 
                                key={macro}
                                type="button"
                                onClick={() => setUrl(prev => prev + macro)}
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #bfdbfe',
                                    color: '#2563eb',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = '#f0f9ff'; e.target.style.borderColor = '#3b82f6'; }}
                                onMouseLeave={(e) => { e.target.style.background = '#ffffff'; e.target.style.borderColor = '#bfdbfe'; }}
                            >
                                {macro}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '24px' }}>
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
