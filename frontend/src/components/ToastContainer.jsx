import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  useEffect(() => {
    // Expose globally so any component can call window.showToast('msg', 'success')
    window.showToast = addToast;
    return () => {
      delete window.showToast;
    };
  }, [addToast]);

  return createPortal(
    <div style={styles.wrapper}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{ ...styles.toast, ...styles[toast.type] }}>
          <span style={styles.icon}>
            {toast.type === 'success'
              ? <CheckCircle size={18} color="#06d6a0" />
              : <AlertCircle size={18} color="#ef476f" />}
          </span>
          <span style={styles.message}>{toast.message}</span>
          <button style={styles.close} onClick={() => removeToast(toast.id)}>
            <X size={14} color="#888" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};

const styles = {
  wrapper: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 999999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    pointerEvents: 'none',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '300px',
    maxWidth: '420px',
    padding: '14px 18px',
    borderRadius: '12px',
    background: '#ffffff',
    boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 12px 36px rgba(0,0,0,0.18)',
    fontSize: '0.92rem',
    fontWeight: 500,
    fontFamily: 'inherit',
    pointerEvents: 'all',
    animation: 'toastIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) both',
  },
  success: {
    borderLeft: '5px solid #06d6a0',
    color: '#1a1a1a',
  },
  error: {
    borderLeft: '5px solid #ef476f',
    color: '#1a1a1a',
  },
  icon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    lineHeight: 1.4,
    color: '#1a1a1a',
  },
  close: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '4px',
    flexShrink: 0,
  },
};

// Inject keyframe animation once
if (typeof document !== 'undefined' && !document.getElementById('toast-keyframes')) {
  const style = document.createElement('style');
  style.id = 'toast-keyframes';
  style.textContent = `
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(calc(100% + 32px)); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
}

export default ToastContainer;