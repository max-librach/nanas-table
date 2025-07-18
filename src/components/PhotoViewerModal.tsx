import React, { useState } from 'react';
import { X, Star, Download, Share, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Memory, Media } from '../types';
import { updateMemory } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { useSwipeable } from 'react-swipeable';

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory;
  selectedPhoto: Media;
  onPhotoUpdate?: (updatedMemory: Memory) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  isOpen,
  onClose,
  memory,
  selectedPhoto,
  onPhotoUpdate
}) => {
  const { user } = useAuth();
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [currentPhotoId, setCurrentPhotoId] = useState(selectedPhoto.id);

  // Find the current photo index based on currentPhotoId
  const currentPhotoIndex = memory.media.findIndex(m => m.id === currentPhotoId);
  const currentPhoto = memory.media[currentPhotoIndex];
  const hasNext = currentPhotoIndex < memory.media.length - 1;
  const hasPrev = currentPhotoIndex > 0;

  // Check if current user is admin or photo owner
  const isAdmin = user?.email === 'maxlibrach@gmail.com';
  const isPhotoOwner = currentPhoto.uploadedBy === user?.email;

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // react-swipeable handlers for mobile
  const handlers = useSwipeable({
    onSwipedLeft: () => nextPhoto(),
    onSwipedRight: () => prevPhoto(),
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 20,
  });

  const nextPhoto = () => {
    if (hasNext) {
      setCurrentPhotoId(memory.media[currentPhotoIndex + 1].id);
    }
  };

  const prevPhoto = () => {
    if (hasPrev) {
      setCurrentPhotoId(memory.media[currentPhotoIndex - 1].id);
    }
  };

  const handleSetAsCover = async () => {
    if (memory.coverPhotoId === currentPhoto.id) return;
    setIsUpdatingCover(true);
    try {
      await updateMemory(memory.id, { coverPhotoId: currentPhoto.id });
      const updatedMemory = { ...memory, coverPhotoId: currentPhoto.id };
      onPhotoUpdate?.(updatedMemory);
      setToastMessage('Cover photo updated!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error setting cover photo:', error);
      setToastMessage('Failed to update cover photo');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsUpdatingCover(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentPhoto.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-${currentPhoto.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToastMessage('Photo downloaded!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error downloading photo:', error);
      setToastMessage('Failed to download photo');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${memory.occasion} - ${memory.date}`,
          text: `Check out this photo from ${memory.occasion}!`,
          url: window.location.href
        });
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setToastMessage('Link copied to clipboard!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error sharing photo:', error);
      setToastMessage('Failed to share photo');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDelete = async () => {
    // TODO: Implement delete functionality
    console.log('Delete photo:', currentPhoto.id);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Toast Message (moved outside modal for visibility) */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className="relative max-w-4xl max-h-[90vh] w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Set as Cover */}
              <Button
                variant="ghost"
                size="sm"
                className={`backdrop-blur-sm hover:bg-white/90 ${
                  memory.coverPhotoId === currentPhoto.id 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-white/90 text-gray-700'
                }`}
                onClick={handleSetAsCover}
                disabled={isUpdatingCover}
                title={memory.coverPhotoId === currentPhoto.id ? 'This is the cover photo' : 'Set as cover photo'}
              >
                <Star className={`w-5 h-5 ${memory.coverPhotoId === currentPhoto.id ? 'fill-current' : ''}`} />
              </Button>

              {/* Download */}
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700"
                onClick={handleDownload}
                title="Download photo"
              >
                <Download className="w-5 h-5" />
              </Button>

              {/* Share */}
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700"
                onClick={handleShare}
                title="Share photo"
              >
                <Share className="w-5 h-5" />
              </Button>

              {/* Delete (admin/owner only) */}
              {(isAdmin || isPhotoOwner) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm hover:bg-red-100 text-red-600"
                  onClick={handleDelete}
                  title="Delete photo"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Photo */}
          <div className="relative w-full h-full" {...(isMobile ? handlers : {})}>
            <img
              src={currentPhoto.fileUrl}
              alt={currentPhoto.caption || 'Photo'}
              className="w-full h-full object-contain"
            />
            {/* Navigation Arrows (desktop only) */}
            {hasPrev && !isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700"
                onClick={prevPhoto}
                title="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}
            {hasNext && !isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700"
                onClick={nextPhoto}
                title="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}
          </div>

          {/* Footer with photo info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <div className="text-white">
              {currentPhoto.caption && (
                <p className="text-lg font-medium mb-2">{currentPhoto.caption}</p>
              )}
              <p className="text-white/80">
                by {currentPhoto.uploadedByName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 