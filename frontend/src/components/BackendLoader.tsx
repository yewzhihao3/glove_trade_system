import { useEffect, useState } from 'react';
import { type BackendStatus } from '../hooks/useBackendHealth';

interface BackendLoaderProps {
  status: BackendStatus;
  retryCount: number;
  onRetry: () => void;
}

export default function BackendLoader({ status, retryCount, onRetry }: BackendLoaderProps) {
  const [visible, setVisible] = useState(false);

  // Fade-in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const isSlow = status === 'slow';
  const isError = status === 'error';

  return (
    <div
      className="backend-loader-overlay"
      style={{ opacity: visible ? 1 : 0 }}
      aria-live="polite"
      role="status"
    >
      {/* Background mesh */}
      <div className="backend-loader-bg" />

      <div className="backend-loader-card">
        {/* Logo / Icon */}
        <div className="backend-loader-icon-wrap">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="backend-loader-logo"
          >
            <circle cx="24" cy="24" r="22" stroke="url(#grad)" strokeWidth="2.5" />
            <path
              d="M14 24 L24 14 L34 24 L24 34 Z"
              stroke="url(#grad)"
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="24" r="4" fill="url(#grad)" />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title */}
        <h1 className="backend-loader-title">Trade Intelligence Platform</h1>

        {/* Status content */}
        {!isError ? (
          <>
            {/* Spinner */}
            <div className="backend-loader-spinner-wrap">
              <div className="backend-loader-spinner" />
            </div>

            <p className="backend-loader-subtitle">
              {isSlow ? 'Server is taking longer than expected…' : 'Connecting to server…'}
            </p>

            <p className="backend-loader-note">
              {isSlow
                ? 'The backend is still warming up. Please wait or try again.'
                : 'Waking up backend (may take a few seconds)'}
            </p>

            {retryCount > 0 && (
              <p className="backend-loader-attempts">
                Attempt {retryCount + 1}…
              </p>
            )}

            {isSlow && (
              <button
                id="backend-loader-retry-btn"
                className="backend-loader-btn"
                onClick={onRetry}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
                Retry Now
              </button>
            )}
          </>
        ) : (
          <>
            <div className="backend-loader-error-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="backend-loader-subtitle">Unable to connect to server</p>
            <p className="backend-loader-note">
              The backend did not respond. Please check your connection or try again.
            </p>
            <button
              id="backend-loader-error-retry-btn"
              className="backend-loader-btn"
              onClick={onRetry}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              Retry Connection
            </button>
          </>
        )}

        {/* Dots pulse */}
        {!isError && (
          <div className="backend-loader-dots">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <style>{`
        .backend-loader-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020617;
          z-index: 9999;
          transition: opacity 0.4s ease;
        }

        .backend-loader-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 15% 20%, rgba(56,189,248,0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 80%, rgba(16,185,129,0.1) 0%, transparent 55%);
          pointer-events: none;
        }

        .backend-loader-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          padding: 3rem 2.5rem;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(56, 189, 248, 0.12);
          border-radius: 24px;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 32px 64px -16px rgba(0,0,0,0.7);
          max-width: 440px;
          width: 90%;
          text-align: center;
          animation: loaderCardIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes loaderCardIn {
          from { transform: translateY(20px) scale(0.97); opacity: 0; }
          to   { transform: translateY(0) scale(1);      opacity: 1; }
        }

        .backend-loader-icon-wrap {
          margin-bottom: 1.5rem;
          animation: loaderIconPulse 3s ease-in-out infinite;
        }

        @keyframes loaderIconPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(56,189,248,0.3)); }
          50%       { transform: scale(1.05); filter: drop-shadow(0 0 18px rgba(56,189,248,0.6)); }
        }

        .backend-loader-logo {
          width: 56px;
          height: 56px;
        }

        .backend-loader-title {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 1.75rem;
        }

        .backend-loader-spinner-wrap {
          margin-bottom: 1.25rem;
        }

        .backend-loader-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(56, 189, 248, 0.15);
          border-top-color: #38bdf8;
          border-radius: 50%;
          animation: loaderSpin 0.85s linear infinite;
        }

        @keyframes loaderSpin {
          to { transform: rotate(360deg); }
        }

        .backend-loader-subtitle {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 1rem;
          font-weight: 500;
          color: #e2e8f0;
          margin: 0 0 0.5rem;
        }

        .backend-loader-note {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.82rem;
          color: #64748b;
          margin: 0 0 1rem;
          line-height: 1.5;
        }

        .backend-loader-attempts {
          font-family: 'Inter', system-ui, monospace;
          font-size: 0.75rem;
          color: #475569;
          margin: 0 0 0.75rem;
        }

        .backend-loader-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding: 0.6rem 1.4rem;
          background: linear-gradient(135deg, rgba(56,189,248,0.15), rgba(16,185,129,0.15));
          color: #7dd3fc;
          border: 1px solid rgba(56,189,248,0.3);
          border-radius: 10px;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .backend-loader-btn:hover {
          background: linear-gradient(135deg, rgba(56,189,248,0.25), rgba(16,185,129,0.25));
          border-color: rgba(56,189,248,0.5);
          color: #bae6fd;
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(56,189,248,0.2);
        }

        .backend-loader-btn:active {
          transform: translateY(0);
        }

        .backend-loader-error-icon {
          margin-bottom: 1rem;
        }

        .backend-loader-dots {
          display: flex;
          gap: 6px;
          margin-top: 1.75rem;
        }

        .backend-loader-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(56, 189, 248, 0.5);
          animation: loaderDotBounce 1.4s ease-in-out infinite;
        }

        .backend-loader-dots span:nth-child(2) { animation-delay: 0.2s; }
        .backend-loader-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes loaderDotBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1.1); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
