import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  caption?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, caption, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  // Generate thumbnail from video
  const generateThumbnail = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setThumbnailUrl(url);
      }
    }, 'image/jpeg', 0.8);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(video.duration);
      
      // Seek to 1 second to get a good thumbnail
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    const handleSeeked = () => {
      if (!showVideo && !thumbnailUrl) {
        // Generate thumbnail when we've seeked to the preview position
        setTimeout(generateThumbnail, 100);
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setShowVideo(true);
    };

    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setShowVideo(false);
      // Reset to thumbnail view
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      
      // Clean up thumbnail URL
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [src, showVideo, thumbnailUrl]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // If not showing video yet, seek to start and play
      if (!showVideo) {
        video.currentTime = 0;
      }
      video.play().catch(console.error);
    }
  };

  const handleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen();
    } else if ((video as any).msRequestFullscreen) {
      (video as any).msRequestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (hasError) {
    return (
      <div className={`relative bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <div className="text-gray-400 mb-2">⚠️</div>
          <p className="text-sm text-gray-600">Video failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
          showVideo ? 'opacity-100' : 'opacity-0'
        }`}
        preload="metadata"
        playsInline
        muted={isMuted}
        style={{ display: showVideo ? 'block' : 'none' }}
      />

      {/* Thumbnail overlay */}
      {!showVideo && thumbnailUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center rounded-lg cursor-pointer"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
          onClick={handlePlayPause}
        />
      )}

      {/* Fallback gradient when no thumbnail */}
      {!showVideo && !thumbnailUrl && !isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg cursor-pointer flex items-center justify-center"
          onClick={handlePlayPause}
        >
          <div className="text-center">
            <Play className="w-12 h-12 text-orange-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Click to play video</p>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading video...</p>
          </div>
        </div>
      )}

      {/* Video Controls Overlay */}
      <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full p-3 hover:bg-opacity-80 transition-all disabled:opacity-50"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </button>

        {/* Bottom Controls - only show when video is playing */}
        {showVideo && (
          <div className="absolute bottom-3 left-3 right-3">
            {/* Progress Bar */}
            {duration > 0 && (
              <div className="mb-2">
                <div className="w-full bg-black bg-opacity-40 rounded-full h-1">
                  <div 
                    className="bg-white rounded-full h-1 transition-all duration-100"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Mute Button */}
                <button
                  onClick={handleMute}
                  className="bg-black bg-opacity-60 text-white rounded-full p-2 hover:bg-opacity-80 transition-all"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Time Display */}
                {duration > 0 && (
                  <div className="text-white text-xs bg-black bg-opacity-60 px-2 py-1 rounded">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={handleFullscreen}
                className="bg-black bg-opacity-60 text-white rounded-full p-2 hover:bg-opacity-80 transition-all"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-lg">
          <p className="text-white text-sm font-medium">{caption}</p>
        </div>
      )}

      {/* Video Icon Indicator */}
      <div className="absolute top-3 left-3">
        <div className="bg-black bg-opacity-60 text-white rounded-full p-1.5">
          <Play className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};