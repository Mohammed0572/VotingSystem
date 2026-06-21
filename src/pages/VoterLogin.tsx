import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const VoterLogin = () => {
  const { t } = useLanguage();
  const { setAuth } = useAuth();
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
        credentials: 'include', // allow browser to store the HttpOnly cookie
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
        // Token is now stored in an HttpOnly cookie by the backend.
        // We just update React state with the non-sensitive session info.
        setAuth({ voter_id: data.voter_id, role: data.role });
        
        setTimeout(() => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          navigate('/voting');
        }, 1500);
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
      <div className="w-full max-w-md overflow-hidden rounded-md border border-hairline bg-paper shadow-sm">
        <div className="border-b border-hairline bg-paper-warm p-6 text-center">
          <h2 className="font-display text-2xl font-semibold text-ink">{t('voter.title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('voter.subtitle')}</p>
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
            className="w-full rounded-md border border-hairline bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted-foreground focus:border-saffron focus:outline-none focus:ring-1 focus:ring-saffron"
            maxLength={64}
            autoComplete="off"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">{t('voter.step2')}</label>
          <p className="mb-2 text-xs text-muted-foreground">{t('voter.align_face')}</p>
          <div className="group relative aspect-video w-full overflow-hidden rounded-md border border-hairline bg-paper-warm">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            {!isCameraActive && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-paper-warm text-muted-foreground">
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
            <button onClick={startWebcam} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-hairline bg-paper px-4 py-2 text-sm font-semibold text-ink hover:border-ink">
              {t('voter.enable_cam')}
            </button>
          ) : (
            <button
              onClick={verifyVoter}
              disabled={isProcessing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-saffron px-4 py-2 text-sm font-semibold text-paper shadow-sm hover:bg-saffron/90 disabled:cursor-not-allowed disabled:opacity-50"
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
