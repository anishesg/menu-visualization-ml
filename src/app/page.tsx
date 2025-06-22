"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

interface MenuItem {
  item: string;
  image: string | null;
}

export default function MenuUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);

  // Check if device is mobile and camera is supported
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    const checkCamera = () => {
      setCameraSupported(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    };
    
    checkMobile();
    checkCamera();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      if (!selectedFile.type.startsWith('image/')) {
        setError("Please select a valid image file");
        return;
      }
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setCapturedPhoto(null);
      setError("");
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile if available
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      setError("");
      
      // Set video source after a small delay to ensure ref is ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
      
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please check permissions or use file upload instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], 'captured-menu.jpg', { type: 'image/jpeg' });
        setFile(capturedFile);
        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file or take a photo first");
      return;
    }
    
    setLoading(true);
    setError("");
    setMenuData([]);

    const formData = new FormData();
    formData.append("menuImage", file);

    try {
      const { data } = await axios.post(
        "/api/upload",
        formData,
        { 
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000 // 60 second timeout
        }
      );
      
      if (data.menu && data.menu.length > 0) {
        setMenuData(data.menu);
      } else {
        setError("No menu items were found in the image");
      }
         } catch (err: unknown) {
       console.error("Upload error:", err);
       if (err && typeof err === 'object' && 'response' in err) {
         const errorResponse = (err as { response: { data: { error?: string } } }).response;
         setError(`Server error: ${errorResponse.data.error || 'Unknown error'}`);
       } else if (err && typeof err === 'object' && 'request' in err) {
         setError("Cannot connect to server. Please try again later.");
       } else {
         setError("An unexpected error occurred");
       }
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setCapturedPhoto(null);
    setMenuData([]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            🍽️ Menu Visualizer
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Upload a menu photo and let AI extract items with beautiful food images
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 text-center">
            📸 Upload or Capture Menu
          </h2>
          
          {!showCamera ? (
            <div className="space-y-4 sm:space-y-6">
              {/* File Input Section */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-blue-400 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFile}
                    id="file-input"
                    className="hidden"
                  />
                  <label 
                    htmlFor="file-input"
                    className="cursor-pointer flex flex-col items-center space-y-3"
                  >
                    <div className="text-4xl sm:text-6xl">📁</div>
                    <p className="text-sm sm:text-base font-medium text-gray-700">
                      Click to select menu image
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      PNG, JPG up to 10MB
                    </p>
                  </label>
                </div>
                
                                                  {/* Camera Button - Show on mobile or if camera is supported */}
                 {(isMobile || cameraSupported) && (
                  <div className="flex justify-center">
                    <button
                      onClick={startCamera}
                      className="flex items-center space-x-2 px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      <span className="text-lg">📷</span>
                      <span className="text-sm sm:text-base">Take Photo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Section */}
              {(file || capturedPhoto) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      {capturedPhoto && (
                        <img 
                          src={capturedPhoto} 
                          alt="Captured menu" 
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="text-sm sm:text-base font-medium text-gray-700">
                          {file?.name || "Captured Photo"}
                        </p>
                        {file && (
                          <p className="text-xs sm:text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={resetUpload}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
        </div>
              )}
              
              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={loading || (!file && !capturedPhoto)}
                className={`w-full py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 ${
                  loading || (!file && !capturedPhoto)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing Menu...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <span>🔍</span>
                    <span>Analyze Menu</span>
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* Camera Interface */
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 sm:h-80 md:h-96 object-cover"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={capturePhoto}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  📸 Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm sm:text-base">{error}</p>
            </div>
          )}
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Results Section */}
        {menuData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                🍽️ Menu Items Found
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Discovered {menuData.length} delicious items
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {menuData.map((item, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.item}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const sibling = target.nextSibling as HTMLElement;
                          if (sibling) sibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    <div className={`w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center ${item.image ? 'hidden' : 'flex'}`}>
                      <div className="text-center p-8">
                        <div className="text-5xl mb-3">🍽️</div>
                        <p className="text-gray-600 text-sm font-medium">No image available</p>
                      </div>
                    </div>
                    
                    {/* Price badge if visible */}
                    {item.item.includes('$') && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-gray-800 shadow-lg">
                        {item.item.split(' - $')[1] ? `$${item.item.split(' - $')[1]}` : item.item.match(/\$[\d.]+/)?.[0] || ''}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-sm sm:text-base text-gray-800 leading-tight mb-2">
                      {item.item.split(' - $')[0] || item.item.split(' $')[0] || item.item}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>AI Selected</span>
                      <span>#{index + 1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <button
                onClick={resetUpload}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                🔄 Upload Another Menu
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-3 text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm sm:text-base font-medium">
                Please wait while we extract menu items and find appetizing images...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
