import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const { t } = useLanguage();
  const { setAuth } = useAuth();
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const navigate = useNavigate();

  const updateStatus = (msg: string, type: string = 'info') => {
    setStatus({ message: msg, type });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.length > 64) {
      e.preventDefault();
      updateStatus("Input length exceeded maximum allowed limit.", "error");
    }
  };

  const adminLogin = async () => {
    if (!adminId.trim() || !adminPassword.trim()) {
      updateStatus("Please enter both Admin ID and Password.", "error");
      return;
    }

    setIsProcessing(true);
    updateStatus("Authenticating...", "info");

    try {
      const response = await fetch('http://127.0.0.1:8000/verify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // allow browser to store the HttpOnly cookie
        body: JSON.stringify({ 
          voter_id: adminId, 
          image_base64: adminPassword,
          nonce: crypto.randomUUID(),
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.role === 'admin') {
          updateStatus("Authentication successful. Redirecting...", "success");
          // Token is now stored in an HttpOnly cookie by the backend.
          // We just update React state with the non-sensitive session info.
          setAuth({ voter_id: data.voter_id, role: data.role });
          setTimeout(() => navigate('/admin'), 1000);
        } else {
          updateStatus("Access denied. Admin privileges required.", "error");
          setIsProcessing(false);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        updateStatus(`Failed: ${errData.detail || 'Invalid credentials.'}`, "error");
        setIsProcessing(false);
      }
    } catch (error) {
      updateStatus("Network error. Ensure backend is running.", "error");
      setIsProcessing(false);
    }
  };

  return (
    <div className="grow flex flex-col items-center justify-center w-full">
      <div className="gov-panel w-full max-w-md overflow-hidden">
        <div className="bg-(--cream) border-b border-(--border) p-6 text-center">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-head)', color: 'var(--ashoka-navy)' }}>{t('adminlogin.title')}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('adminlogin.subtitle')}</p>
        </div>

      <div className="p-6 sm:p-8 space-y-5 fade-in">
        <div>
          <label htmlFor="adminId">{t('adminlogin.id_label')}</label>
          <input
            id="adminId"
            type="text"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            onPaste={handlePaste}
            placeholder={t('adminlogin.id_placeholder')}
            className="gov-input"
            maxLength={64}
            autoComplete="off"
          />
        </div>
        
        <div>
          <label htmlFor="adminPassword">Password</label>
          <input
            id="adminPassword"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onPaste={handlePaste}
            placeholder="Enter Password"
            className="gov-input"
            maxLength={64}
            autoComplete="off"
          />
        </div>

        {status.message && (
          <div className={`p-4 border-l-4 rounded-sm ${status.type === 'error' ? 'bg-[#FFF5F5] border-danger text-danger' : status.type === 'success' ? 'bg-india-green-light border-india-green text-india-green' : 'bg-india-blue-lt border-india-blue text-india-blue'}`}>
            <strong>{t('voter.status')}</strong> {status.message}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={adminLogin}
            disabled={isProcessing}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? t('voter.processing') : t('adminlogin.login_btn')}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminLogin;
