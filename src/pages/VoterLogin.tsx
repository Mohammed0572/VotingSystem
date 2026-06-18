import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const VoterLogin = () => {
  const { t } = useLanguage();
  const [voterId, setVoterId] = useState('');
  
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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.length > 64 || !/^[A-Za-z0-9/-]+$/.test(pastedText)) {
      e.preventDefault();
      updateStatus("Invalid paste format or length exceeded. Only alphanumeric characters and hyphens/slashes are allowed.", "error");
    }
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

    setIsProcessing(true);
    updateStatus("Recording liveness data... Please blink!", "info");

    const frames: string[] = [];
    const maxFrames = 10;
    const frameInterval = 150; // ms

    for (let i = 0; i < maxFrames; i++) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.7));
        if (i < maxFrames - 1) {
            await new Promise(resolve => setTimeout(resolve, frameInterval));
        }
    }

    updateStatus("Verifying identity securely...", "info");

    try {
      const response = await fetch('http://127.0.0.1:8000/verify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          voter_id: voterId, 
          images_base64: frames,
          nonce: crypto.randomUUID(),
          timestamp: Date.now()
        })
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

  return (
    <div className="grow flex flex-col items-center justify-center w-full">
      <div className="gov-panel w-full max-w-md overflow-hidden">
        <div className="bg-(--cream) border-b border-(--border) p-6 text-center">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-head)', color: 'var(--ashoka-navy)' }}>{t('voter.title')}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('voter.subtitle')}</p>
        </div>

      <div className="p-6 sm:p-8 space-y-5">
        <div>
          <label htmlFor="voterId">{t('voter.id_label')}</label>
          <input
            id="voterId"
            type="text"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            onPaste={handlePaste}
            placeholder="e.g. VTR-84291"
            className="gov-input"
            maxLength={64}
            autoComplete="off"
          />
        </div>

        <div>
          <label>{t('voter.step2')}</label>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{t('voter.align_face')}</p>
          <div className="relative w-full aspect-video bg-(--cream) overflow-hidden border-2 border-(--border) rounded-sm group">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-(--cream) z-10" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <span className="text-base font-bold">{t('voter.cam_inactive')}</span>
              </div>
            )}
          </div>
        </div>

        {status.message && (
          <div className={`p-4 border-l-4 rounded-sm ${status.type === 'error' ? 'bg-[#FFF5F5] border-danger text-danger' : status.type === 'success' ? 'bg-india-green-light border-india-green text-india-green' : 'bg-india-blue-lt border-india-blue text-india-blue'}`}>
            <strong>{t('voter.status')}</strong> {status.message}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {!isCameraActive ? (
            <button onClick={startWebcam} className="btn-secondary w-full">
              {t('voter.enable_cam')}
            </button>
          ) : (
            <button
              onClick={verifyVoter}
              disabled={isProcessing}
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? t('voter.processing') : t('voter.verify_btn')}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default VoterLogin;
