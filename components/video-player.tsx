"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Loader2 } from "lucide-react";

type Props = {
  src: string;
  poster?: string;
  className?: string;
};

export function VideoPlayer({ src, poster, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Auto-play on mount
    const video = videoRef.current;
    if (video) {
      // Try to play automatically
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setShowControls(false);
          })
          .catch(() => {
            // Auto-play was prevented
            setIsPlaying(false);
            setShowControls(true);
          });
      }
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        setShowControls(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isDragging) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setProgress(newValue);
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime =
        (videoRef.current.duration / 100) * newValue;
    }
  };

  const handleCanPlay = () => {
    setIsReady(true);
  };

  const handleWaiting = () => {
    // Optional: could show buffering state here
  };

  const handlePlaying = () => {
    setIsPlaying(true);
    // Hide controls when playing starts
    if (!showControls) setShowControls(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  return (
    <div className="relative h-full w-full bg-black" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        className={className}
        poster={poster}
        playsInline
        loop
        muted={false}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onPause={handlePause}
      />

      {/* Play/Pause/Loading Overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          !isPlaying || showControls ? "opacity-100" : "opacity-0"
        } pointer-events-none`}
      >
        {!isReady ? (
          <div className="rounded-full bg-black/40 p-4 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : (
          <div className="rounded-full bg-black/40 p-4 backdrop-blur-sm">
            {isPlaying ? (
              <Pause className="h-8 w-8 text-white fill-white" />
            ) : (
              <Play className="h-8 w-8 text-white fill-white ml-1" />
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-6 z-50 flex items-end pb-0 cursor-pointer group"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Range (Invisible but interactive) */}
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleSeek}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          className="absolute inset-0 z-30 w-full h-full opacity-0 cursor-pointer"
        />

        {/* Visual Track */}
        <div className="fixed z-50 w-full bg-white/30 h-2 transition-all duration-200">
          {/* Filled Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-white transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
