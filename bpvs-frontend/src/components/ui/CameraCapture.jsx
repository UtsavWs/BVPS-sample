import { useRef, useState, useEffect, useCallback } from "react";
import { X, SwitchCamera, RotateCcw, Check, ImageOff } from "lucide-react";

/**
 * Reusable in-app camera.
 *  - Live preview via getUserMedia (works on desktop webcam + mobile)
 *  - Front / back camera toggle (facingMode user | environment)
 *  - Capture → review → Use Photo (returns a File) or Retake
 *  - Graceful fallback when camera is blocked / missing / unsupported
 *
 * Usage:
 *   {showCamera && (
 *     <CameraCapture
 *       onCapture={(file) => handleFile(file)}
 *       onClose={() => setShowCamera(false)}
 *     />
 *   )}
 */
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("environment"); // back camera by default
  const [captured, setCaptured] = useState(null); // { url, file }
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);
  const [addedCount, setAddedCount] = useState(0); // photos added this session

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startStream = useCallback(
    async (mode) => {
      setStarting(true);
      setError("");
      stopStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.error("Camera error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
          setError("Camera permission was denied. Allow access in your browser, or upload a file instead.");
        else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError")
          setError("No camera was found on this device. Please upload a file instead.");
        else setError("Could not start the camera. Please upload a file instead.");
      } finally {
        setStarting(false);
      }
    },
    [stopStream],
  );

  // Start on mount, clean up on unmount.
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not supported on this device. Please upload a file instead.");
      setStarting(false);
      return;
    }
    startStream("environment");
    return () => stopStream();
  }, [startStream, stopStream]);

  const flipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startStream(next);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    // Mirror front-camera shots so the saved image matches the preview.
    if (facingMode === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        setCaptured({ url: URL.createObjectURL(blob), file });
        stopStream();
      },
      "image/jpeg",
      0.92,
    );
  };

  const retake = () => {
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    startStream(facingMode);
  };

  // Add the captured photo and return to the live view to take another.
  const addPhoto = () => {
    if (captured) {
      onCapture(captured.file);
      URL.revokeObjectURL(captured.url);
      setAddedCount((c) => c + 1);
      setCaptured(null);
      startStream(facingMode);
    }
  };

  const handleClose = (revoke = true) => {
    stopStream();
    if (revoke && captured) URL.revokeObjectURL(captured.url);
    onClose();
  };

  const isFront = facingMode === "user";

  return (
    <div className="fixed inset-0 z-[700] bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0">
        <button
          onClick={() => handleClose()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer border-none text-white"
        >
          <X size={20} />
        </button>
        <span className="text-sm font-semibold">
          {captured
            ? "Review Photo"
            : addedCount > 0
              ? `Take Photo · ${addedCount} added`
              : "Take Photo"}
        </span>
        {!captured && !error ? (
          <button
            onClick={flipCamera}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer border-none text-white"
            title="Switch camera"
          >
            <SwitchCamera size={19} />
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>

      {/* Stage */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-3">
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center text-white/90 max-w-xs">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <ImageOff size={26} />
            </div>
            <p className="text-[13.5px] leading-relaxed">{error}</p>
            <button
              onClick={() => handleClose()}
              className="mt-1 px-5 py-2.5 rounded-xl bg-[#C0441F] hover:bg-[#A63818] text-white text-sm font-semibold transition cursor-pointer border-none"
            >
              Close & upload a file
            </button>
          </div>
        ) : captured ? (
          <img
            src={captured.url}
            alt="Captured"
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-h-full max-w-full rounded-2xl object-contain bg-black"
              style={{ transform: isFront ? "scaleX(-1)" : "none" }}
            />
            {starting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {!error && (
        <div className="shrink-0 px-6 pb-8 pt-4">
          {captured ? (
            <div className="flex items-center gap-3 max-w-md mx-auto">
              <button
                onClick={retake}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition cursor-pointer"
              >
                <RotateCcw size={16} /> Retake
              </button>
              <button
                onClick={addPhoto}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#C0441F] hover:bg-[#A63818] text-white text-sm font-semibold transition cursor-pointer border-none"
              >
                <Check size={17} /> Add Photo
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center relative">
              <button
                onClick={takePhoto}
                disabled={starting}
                aria-label="Capture photo"
                className="rounded-full bg-white/15 p-1.5 disabled:opacity-50 cursor-pointer border-none transition active:scale-95"
                style={{ width: 72, height: 72 }}
              >
                <span className="block w-full h-full rounded-full bg-white border-4 border-black/20" />
              </button>
              {addedCount > 0 && (
                <button
                  onClick={() => handleClose()}
                  className="absolute right-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-white/90 transition cursor-pointer border-none"
                >
                  <Check size={16} /> Done
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
