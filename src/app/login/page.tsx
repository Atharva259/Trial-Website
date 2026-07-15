'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, LogIn, ArrowRight } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
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
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push(redirectPath);
        router.refresh();
      } else {
        setError(data.error || 'Authentication failed. Please verify your email or password.');
      }
    } catch (err) {
      setError('A network error occurred. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
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
              background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(234, 88, 12, 0.2)',
              marginBottom: '16px'
            }}
          >
            <Lock size={32} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>BiteFlow</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Authorized Terminal Sign-In
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
                    color: 'var(--danger-color)',
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
                <label className="form-label">Authorized Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail 
                    size={18} 
                    style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-secondary)' }} 
                  />
                  <input
                    type="email"
                    required
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    Verify Credentials
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
              Back to Customer Menu
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Credentials Helper Card */}
          <div 
            className="glass-card" 
            style={{ 
              marginTop: '40px',
              padding: '16px', 
              background: '#FFFFFF', 
              borderColor: 'var(--border-color)',
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-color)', textTransform: 'uppercase', marginBottom: '8px' }}>
              🔑 Staff Portal login info
            </p>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Admin:</span> admin@biteflow.in
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Kitchen:</span> chef@biteflow.in
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Cashier:</span> cashier@biteflow.in
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '4px', paddingTop: '4px', fontWeight: '600' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Password:</span> security-first-2026
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
