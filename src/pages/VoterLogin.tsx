import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VoterLogin = () => {
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

  return (
    <div className="gov-panel max-w-md mx-auto overflow-hidden mt-8">
      <div className="bg-[#f8f5ec] border-b border-[#dfe1e2] p-6 text-center">
        <h2 className="text-2xl font-bold font-heading">Voter Authentication</h2>
        <p className="text-sm text-[#565c65] mt-1">Official Citizen Portal</p>
      </div>

      <div className="p-6 sm:p-8 space-y-5">
        <div>
          <label className="gov-input-label" htmlFor="voterId">Voter Identification Number</label>
          <input
            id="voterId"
            type="text"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            placeholder="e.g. VTR-84291"
            className="gov-input"
          />
        </div>

        <div>
          <label className="gov-input-label">Identity Verification (Step 2)</label>
          <p className="text-sm text-[#565c65] mb-2">Please align your face within the frame to verify your identity.</p>
          <div className="relative w-full aspect-video bg-[#f8f5ec] overflow-hidden border-2 border-[#dfe1e2] rounded-sm group">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f8f5ec] text-[#565c65] z-10">
                <svg className="w-12 h-12 mb-2 text-[#565c65]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <span className="text-base font-bold">Camera Inactive</span>
              </div>
            )}
          </div>
        </div>

        {status.message && (
          <div className={status.type === 'error' ? 'gov-alert-error' : status.type === 'success' ? 'gov-alert-success' : 'gov-alert-info'}>
            <strong>Status:</strong> {status.message}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {!isCameraActive ? (
            <button onClick={startWebcam} className="gov-button-outline">
              Enable Camera
            </button>
          ) : (
            <button
              onClick={verifyVoter}
              disabled={isProcessing}
              className="gov-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Verify Identity & Login'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoterLogin;
