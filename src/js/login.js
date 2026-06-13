document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements mapping
    const elements = {
        video: document.getElementById('webcam-feed'),
        canvas: document.getElementById('hidden-canvas'),
        startBtn: document.getElementById('btn-start-webcam'),
        verifyBtn: document.getElementById('btn-capture-verify'),
        voterIdInput: document.getElementById('voter-id'),
        statusMsg: document.getElementById('status-message')
    };

    let stream = null;

    /**
     * 1. Webcam Integration
     * Requests camera permissions and streams to the video element.
     */
    const startWebcam = async () => {
        try {
            updateStatus("Requesting camera access...", "text-blue-600");
            
            // Request video permission from the user
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            
            // Stream the feed to the HTML <video> element
            elements.video.srcObject = stream;
            
            // Toggle UI state: Hide "Open Webcam", Show "Verify" button
            elements.startBtn.classList.add('hidden');
            elements.verifyBtn.classList.remove('hidden');
            
            updateStatus("Camera active. Please align your face and enter Voter ID.", "text-green-600");
        } catch (error) {
            // Handle cases where the user denies camera permission or no camera is available
            console.error("Webcam Error:", error);
            updateStatus("Error: Camera access denied or unavailable.", "text-red-600");
        }
    };

    /**
     * 2. Image Capture & Base64 Conversion
     * Captures the current frame from the video element and converts it to a Base64 string.
     */
    const captureImage = () => {
        const context = elements.canvas.getContext('2d');
        
        // Match canvas dimensions to the actual video stream
        elements.canvas.width = elements.video.videoWidth;
        elements.canvas.height = elements.video.videoHeight;
        
        // Draw the current video frame onto the hidden canvas
        context.drawImage(elements.video, 0, 0, elements.canvas.width, elements.canvas.height);
        
        // Convert the canvas drawing to a Base64 JPEG string
        return elements.canvas.toDataURL('image/jpeg');
    };

    /**
     * 3. API Communication & 4. State Handling
     * Packages the Base64 image and Voter ID, sends it to the API, and handles the response.
     */
    const verifyIdentity = async () => {
        const voterId = elements.voterIdInput.value.trim();
        
        // Guard clause for missing Voter ID
        if (!voterId) {
            updateStatus("Please enter your Voter ID first.", "text-red-600");
            return;
        }

        // Capture the Base64 image
        const base64Image = captureImage();

        // 4. State Handling: Show "Processing..." status
        elements.verifyBtn.disabled = true;
        elements.verifyBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Processing...
        `;
        updateStatus("Verifying identity securely...", "text-blue-600 animate-pulse font-medium");

        try {
            // 3. API Communication (Fetch POST request)
            const response = await fetch('http://127.0.0.1:8000/verify-face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    voter_id: voterId,
                    image_base64: base64Image
                })
            });

            // 4. State Handling & Redirection
            if (response.ok) { // 200 OK status
                const data = await response.json();
                
                updateStatus("Authentication Successful! Redirecting...", "text-green-600 font-bold");
                
                // Assuming backend returns {"token": "..."} or {"access_token": "..."}
                const token = data.access_token || data.token || data; 
                
                // Save the JWT token
                localStorage.setItem('auth_token', token);
                
                // Stop the webcam feed to free up hardware resources
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                
                // Redirect to the Voting Dashboard
                setTimeout(() => {
                    window.location.href = `/index.html?Authorization=Bearer ${token}`;
                }, 1500);

            } else if (response.status === 401) { // 401 Unauthorized status
                updateStatus("Face mismatch or Voter ID not found.", "text-red-600 font-bold");
                resetVerifyButton();
            } else { // Handle other backend errors (500, 422, etc)
                const errorData = await response.json().catch(() => ({}));
                updateStatus(`Verification Failed: ${errorData.detail || 'Server error.'}`, "text-red-600 font-bold");
                resetVerifyButton();
            }
        } catch (error) {
            // Network Failure Scenario
            console.error("API Error:", error);
            updateStatus("Network error. Please check your connection or backend status.", "text-red-600 font-bold");
            resetVerifyButton();
        }
    };

    /**
     * Helper: Updates the status message text and tailwind color classes
     */
    const updateStatus = (message, tailwindClasses) => {
        elements.statusMsg.textContent = message;
        // Keep base classes and apply the requested colors/animations
        elements.statusMsg.className = `mt-2 text-sm text-center min-h-[1.25rem] ${tailwindClasses}`;
    };

    /**
     * Helper: Re-enables the verify button if a failure occurs
     */
    const resetVerifyButton = () => {
        elements.verifyBtn.disabled = false;
        elements.verifyBtn.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Capture & Verify
        `;
        elements.statusMsg.classList.remove('animate-pulse');
    };

    // Attach Event Listeners (Guard clauses added to prevent errors if elements aren't found)
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', startWebcam);
    }
    
    if (elements.verifyBtn) {
        elements.verifyBtn.addEventListener('click', verifyIdentity);
    }
});
