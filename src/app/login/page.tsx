'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, LogIn, ArrowRight } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const [personalId, setPersonalId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personalId, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to protected route
        router.push(redirectPath);
        router.refresh();
      } else {
        setError(data.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('A network error occurred. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    // Customers order as guests
    router.push('/');
  };

  return (
    <div className="device-container">
      <div className="smartphone-frame">
        {/* Header decoration */}
        <div style={{ padding: '64px 24px 20px 24px', textAlign: 'center' }}>
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)',
              marginBottom: '16px'
            }}
          >
            <Lock size={32} color="#000000" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>BiteFlow</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Secure Restaurant Terminal Sign-In
          </p>
        </div>

        {/* Login Form Body */}
        <div className="screen-content" style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <form onSubmit={handleLogin} style={{ marginTop: '16px' }}>
              {error && (
                <div 
                  style={{ 
                    background: 'var(--danger-glow)', 
                    border: '1px solid var(--danger-color)', 
                    color: '#ff6b6b',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    marginBottom: '20px'
                  }}
                >
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Personal ID</label>
                <div style={{ position: 'relative' }}>
                  <User 
                    size={18} 
                    style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-secondary)' }} 
                  />
                  <input
                    type="text"
                    required
                    placeholder="Enter Admin ID"
                    value={personalId}
                    onChange={(e) => setPersonalId(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '48px' }}
                    disabled={loading}
                    id="admin_id_input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    size={18} 
                    style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-secondary)' }} 
                  />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '48px' }}
                    disabled={loading}
                    id="admin_password_input"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', marginBottom: '16px' }}
                id="admin_login_submit"
              >
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <LogIn size={18} />
                    Verify Admin ID
                  </>
                )}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            <button 
              onClick={handleGuestAccess} 
              className="btn btn-secondary"
              style={{ width: '100%', borderStyle: 'dashed' }}
              disabled={loading}
              id="guest_checkout_btn"
            >
              Order Foods (Guest Access)
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Credentials Helper Card */}
          <div 
            className="glass-card" 
            style={{ 
              marginTop: '40px',
              padding: '16px', 
              background: 'rgba(255,255,255,0.02)', 
              borderColor: 'rgba(255,255,255,0.05)',
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-color)', textTransform: 'uppercase', marginBottom: '8px' }}>
              🔑 Trial Admin Credentials
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12px', color: 'var(--text-primary)' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>ID:</span> admin-trial
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Pass:</span> security-first-2026
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="device-container">
        <div className="smartphone-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ color: 'var(--accent-color)' }}></div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
