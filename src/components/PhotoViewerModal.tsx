import React, { useState, useEffect, useRef } from 'react';
import { X, Star, Download, Share, ChevronLeft, ChevronRight, Trash2, Utensils } from 'lucide-react';
import { Button } from './ui/button';
import { Memory, Media } from '../types';
import { updateMemory, deleteMedia, getAllRecipes, getMemory } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { useSwipeable } from 'react-swipeable';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { RecipeTagSelector } from './RecipeTagSelector';

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
  const [allRecipes, setAllRecipes] = useState<{ id: string; title: string }[]>([]);
  const [photoRecipeTags, setPhotoRecipeTags] = useState<string[]>(selectedPhoto?.recipeIds || []);
  const [showTagModal, setShowTagModal] = useState(false);
  const tagButtonRef = useRef<HTMLButtonElement>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Find the current photo index based on currentPhotoId
  const currentPhotoIndex = memory.media.findIndex(m => m.id === currentPhotoId);
  const currentPhoto = memory.media[currentPhotoIndex];
  const hasNext = currentPhotoIndex < memory.media.length - 1;
  const hasPrev = currentPhotoIndex > 0;

  // Check if current user is admin or photo owner
  const isAdmin = user?.email === 'maxlibrach@gmail.com';
  const isPhotoOwner = currentPhoto?.uploadedBy === user?.email;

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

  useEffect(() => {
    getAllRecipes().then(setAllRecipes);
  }, []);

  useEffect(() => {
    setPhotoRecipeTags(currentPhoto?.recipeIds || []);
  }, [currentPhotoId]);

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
    console.log('Delete button clicked for photo:', currentPhoto);
    console.log('Current user:', user?.email);
    console.log('Is admin:', isAdmin);
    console.log('Is photo owner:', isPhotoOwner);
    
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Starting delete process for photo ID:', currentPhoto.id);
      console.log('File URL:', currentPhoto.fileUrl);
      
      // Delete the media using the service function
      await deleteMedia(currentPhoto.id, currentPhoto.fileUrl);
      console.log('Media deleted successfully from Firebase');

      // Update the memory to remove the deleted photo
      const updatedMedia = memory.media.filter(m => m.id !== currentPhoto.id);
      const updatedMemory = { ...memory, media: updatedMedia };
      console.log('Updated memory media count:', updatedMedia.length);

      // If this was the cover photo, clear the cover photo
      if (memory.coverPhotoId === currentPhoto.id) {
        console.log('Clearing cover photo');
        updatedMemory.coverPhotoId = undefined;
        // Update the memory's cover photo in Firestore
        await updateMemory(memory.id, { coverPhotoId: undefined });
      }

      // Notify parent component
      onPhotoUpdate?.(updatedMemory);
      console.log('Parent component notified');

      setToastMessage('Photo deleted successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error deleting photo:', error);
      setToastMessage(`Failed to delete photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  useEffect(() => {
    if (!showActionsMenu) return;
    function handleClick(e: MouseEvent) {
      setShowActionsMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showActionsMenu]);

  if (!isOpen) return null;

  return (
    <>
      {/* Toast Message (moved outside modal for visibility) */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}
      {/* Tag Recipe Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setShowTagModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Tag this photo with a family recipe</h2>
              <button onClick={() => setShowTagModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">&times;</button>
            </div>
            <RecipeTagSelector
              allRecipes={allRecipes}
              selectedRecipeIds={photoRecipeTags}
              onChange={setPhotoRecipeTags}
              hideCheckbox
            />
            <div className="flex justify-end mt-4 gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowTagModal(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="default" onClick={async () => {
                try {
                  const mediaRef = doc(db, 'media', currentPhoto.id);
                  await updateDoc(mediaRef, { recipeIds: photoRecipeTags });
                  // Fetch updated memory and notify parent
                  const updatedMemory = await getMemory(memory.id);
                  if (onPhotoUpdate && updatedMemory) onPhotoUpdate(updatedMemory);
                  setShowTagModal(false);
                  setToastMessage('Recipe tags updated!');
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2000);
                } catch (err) {
                  setToastMessage('Failed to update recipe tags');
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2000);
                }
              }}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div
          className="relative bg-white rounded-2xl shadow-2xl overflow-hidden inline-block mx-auto"
          style={{ maxWidth: '95vw', maxHeight: '95vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header Bar */}
          <div className="sticky top-0 left-0 right-0 z-20 flex items-center justify-between bg-white/95 px-4 py-2 border-b border-orange-100">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-orange-50 text-gray-700"
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
                className={`hover:bg-orange-50 ${
                  memory.coverPhotoId === currentPhoto.id 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'text-gray-700'
                }`}
                onClick={handleSetAsCover}
                disabled={isUpdatingCover}
                title={memory.coverPhotoId === currentPhoto.id ? 'This is the cover photo' : 'Set as cover photo'}
              >
                <Star className={`w-5 h-5 ${memory.coverPhotoId === currentPhoto.id ? 'fill-current' : ''}`} />
              </Button>
              {/* Tag Recipe Icon */}
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-orange-50 text-gray-700"
                onClick={() => setShowTagModal(true)}
                title="Tag with recipe(s)"
              >
                <Utensils className="w-5 h-5" />
              </Button>
              {/* Download */}
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-orange-50 text-gray-700"
                onClick={handleDownload}
                title="Download photo"
              >
                <Download className="w-5 h-5" />
              </Button>
              {/* Delete (admin or owner) */}
              {(isAdmin || isPhotoOwner) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-orange-50 text-red-600"
                  onClick={handleDelete}
                  title="Delete photo"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Photo */}
          <div
            className="relative flex items-center justify-center w-auto h-auto"
            {...(isMobile ? handlers : {})}
          >
            <img
              src={currentPhoto.fileUrl}
              alt={currentPhoto.caption || 'Photo'}
              className="object-contain block mx-auto"
              loading="lazy"
              style={{ maxWidth: '90vw', maxHeight: isMobile ? '100dvh' : '80vh' }}
            />
            {/* Attribution overlay in lower left */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
              <span className="text-white text-xs font-medium shadow-md bg-black/40 px-2 py-1 rounded pointer-events-auto">
                by {currentPhoto.uploadedByName}
              </span>
            </div>
            {/* Carousel Arrows (desktop only) */}
            {hasPrev && !isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700"
                onClick={prevPhoto}
                title="Previous photo"
                style={{ zIndex: 30 }}
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
                style={{ zIndex: 30 }}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}
            {/* Recipe tags as chips in lower right corner */}
            {photoRecipeTags.length > 0 && allRecipes.length > 0 && (
              <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 z-20 pointer-events-none">
                {photoRecipeTags.map(id => {
                  const recipe = allRecipes.find(r => r.id === id);
                  if (!recipe) return null;
                  return (
                    <span key={id} className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium shadow pointer-events-auto">
                      {recipe.title}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}; 