import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const navigate = useNavigate();

  const updateStatus = (msg: string, type: string = 'info') => {
    setStatus({ message: msg, type });
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
        body: JSON.stringify({ voter_id: adminId, image_base64: adminPassword })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.role === 'admin') {
          updateStatus("Authentication successful. Redirecting...", "success");
          localStorage.setItem('adminToken', data.token || data.access_token);
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
    <div className="gov-panel max-w-md mx-auto overflow-hidden mt-8">
      <div className="bg-[#f8f5ec] border-b border-[#dfe1e2] p-6 text-center">
        <h2 className="text-2xl font-bold font-heading">Administrator Access</h2>
        <p className="text-sm text-[#565c65] mt-1">Official Personnel Only</p>
      </div>

      <div className="p-6 sm:p-8 space-y-5 fade-in">
        <div>
          <label className="gov-input-label" htmlFor="adminId">Administrator ID</label>
          <input
            id="adminId"
            type="text"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            placeholder="Enter Official Admin ID"
            className="gov-input"
          />
        </div>
        
        <div>
          <label className="gov-input-label" htmlFor="adminPassword">Password</label>
          <input
            id="adminPassword"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Enter Password"
            className="gov-input"
          />
        </div>

        {status.message && (
          <div className={status.type === 'error' ? 'gov-alert-error' : status.type === 'success' ? 'gov-alert-success' : 'gov-alert-info'}>
            <strong>Status:</strong> {status.message}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={adminLogin}
            disabled={isProcessing}
            className="gov-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Authenticating...' : 'Secure Administrator Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
