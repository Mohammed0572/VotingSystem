import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [activeTab, setActiveTab] = useState('voter'); // 'voter' or 'admin'
  const [voterId, setVoterId] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const navigate = useNavigate();

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const updateStatus = (msg: string, type: string = 'info') => {
    setStatus({ message: msg, type });
  };

  const startWebcam = async () => {
    try {
      updateStatus("Requesting camera access...", "info");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      updateStatus("Camera active. Please align your face and enter Voter ID.", "success");
    } catch (error) {
      console.error("Webcam Error:", error);
      updateStatus("Error: Camera access denied or unavailable.", "error");
    }
  };

  const verifyVoter = async () => {
    if (!voterId.trim()) {
      updateStatus("Please enter your Voter ID first.", "error");
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg');

    setIsProcessing(true);
    updateStatus("Verifying identity securely...", "info");

    try {
      const response = await fetch('http://127.0.0.1:8000/verify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_id: voterId, image_base64: base64Image })
      });

      if (response.ok) {
        const data = await response.json();
        updateStatus("Authentication Successful! Redirecting...", "success");
        const token = data.access_token || data.token || data;
        localStorage.setItem('auth_token', token);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        setTimeout(() => navigate('/voting'), 1500);
      } else if (response.status === 401) {
        updateStatus("Face mismatch or Voter ID not found.", "error");
        setIsProcessing(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        updateStatus(`Verification Failed: ${errorData.detail || 'Server error.'}`, "error");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("API Error:", error);
      updateStatus("Network error. Please check your connection or backend status.", "error");
      setIsProcessing(false);
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
    <div className="glass-panel max-w-md mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        <button
          onClick={() => setActiveTab('voter')}
          className={`flex-1 py-4 text-sm font-semibold transition-colors duration-200 border-b-2 ${activeTab === 'voter' ? 'text-primary-600 border-primary-600' : 'text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-700'}`}
        >
          Voter Login
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-4 text-sm font-semibold transition-colors duration-200 border-b-2 ${activeTab === 'admin' ? 'text-primary-600 border-primary-600' : 'text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-700'}`}
        >
          Admin Login
        </button>
      </div>

      <div className="p-6 sm:p-8">
        {activeTab === 'voter' ? (
          <div className="space-y-5 fade-in">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Voter Authentication</h2>
              <p className="text-sm text-gray-600">Enter credentials and complete facial verification.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voter ID</label>
              <input
                type="text"
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                placeholder="e.g. VTR-84291"
                className="w-full px-4 py-2 bg-white/50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biometric Capture</label>
              <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-300 shadow-inner">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-gray-300 z-10">
                    <span className="text-sm font-medium">Camera Inactive</span>
                  </div>
                )}
              </div>
            </div>

            {status.message && (
              <div className={`text-sm text-center p-2 rounded-md ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'text-blue-600 font-medium animate-pulse'}`}>
                {status.message}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {!isCameraActive ? (
                <button onClick={startWebcam} className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm focus:ring-2 focus:ring-primary-500 focus:ring-offset-1">
                  Open Webcam
                </button>
              ) : (
                <button
                  onClick={verifyVoter}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                >
                  {isProcessing ? 'Processing...' : 'Capture & Verify'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5 fade-in">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Admin Access</h2>
              <p className="text-sm text-gray-600">Authorized personnel only.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin ID</label>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter admin ID"
                className="w-full px-4 py-2 bg-white/50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-shadow"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2 bg-white/50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-shadow"
              />
            </div>

            {status.message && (
              <div className={`text-sm text-center p-2 rounded-md ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'text-blue-600 font-medium'}`}>
                {status.message}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={adminLogin}
                disabled={isProcessing}
                className="w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              >
                {isProcessing ? 'Authenticating...' : 'Access Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
