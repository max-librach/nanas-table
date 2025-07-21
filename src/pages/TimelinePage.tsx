import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { Calendar, Users, ChefHat, Star, Camera, Eye, Plus, Heart, Video, ChevronLeft, ChevronRight, Trash2, MoreVertical } from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';
import { Memory, Media } from '../types';
import { ContributionModal } from '../components/ContributionModal';
import { DeleteMemoryModal } from '../components/DeleteMemoryModal';
import { getMemories, deleteMemory as deleteMemoryFromDB, getAllRecipes } from '../services/firebaseService';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useSwipeable } from 'react-swipeable';
import { PhotoViewerModal } from '../components/PhotoViewerModal';

export const TimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showContribution, setShowContribution] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerMemory, setPhotoViewerMemory] = useState<Memory | null>(null);
  const [photoViewerPhoto, setPhotoViewerPhoto] = useState<Media | null>(null);
  const [recipes, setRecipes] = useState<{ id: string; title: string }[]>([]);

  // Check if current user is Max (admin)
  const isAdmin = user?.email === 'maxlibrach@gmail.com';

  // Load memories and recipes from Firebase
  useEffect(() => {
    loadMemories();
    getAllRecipes().then(setRecipes);
  }, []);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const memoriesData = await getMemories();
      setMemories(memoriesData);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = (memory: Memory) => {
    setSelectedMemory(memory);
    setShowContribution(true);
  };

  const handleDeleteMemory = (memory: Memory) => {
    setMemoryToDelete(memory);
    setShowDeleteModal(true);
  };

  const confirmDeleteMemory = () => {
    if (memoryToDelete) {
      deleteMemoryFromDB(memoryToDelete.id)
        .then(() => {
          setMemories(prev => prev.filter(m => m.id !== memoryToDelete.id));
        })
        .catch((error) => {
          console.error('Error deleting memory:', error);
        });
      setMemoryToDelete(null);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Timeline</h2>
          <p className="text-gray-600">Our moments at Nana's table</p>
          </div>
          <Button
            onClick={() => navigate('/create')}
            className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-medium py-3 px-4 sm:px-6 flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add new memory
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-400"></div>
          </div>
        ) : memories.length === 0 ? (
          <Card className="text-center py-12 bg-white/90 backdrop-blur-sm">
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden opacity-30">
                <img 
                  src="/nanas-table-logo.jpg" 
                  alt="Nana's Table" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No memories yet</h3>
              <p className="text-gray-500 mb-6">Start creating beautiful family memories!</p>
              <Button
                onClick={() => navigate('/create')}
                className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Memory
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {memories.map((memory) => (
              <GridMemoryCard 
                key={memory.id} 
                memory={memory} 
                recipes={recipes}
                onContribute={handleContribute}
                onViewDetails={() => navigate(`/memory/${memory.eventCode}`)}
                onDelete={isAdmin ? () => handleDeleteMemory(memory) : undefined}
                isAdmin={isAdmin}
                onPhotoClick={(photo, mem) => {
                  setPhotoViewerMemory(mem);
                  setPhotoViewerPhoto(photo);
                  setPhotoViewerOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {showContribution && selectedMemory && (
        <ContributionModal
          memory={selectedMemory}
          onClose={() => setShowContribution(false)}
          onSubmit={() => {
            setShowContribution(false);
            loadMemories(); // Refresh memories to show new contributions
          }}
        />
      )}

      {showDeleteModal && memoryToDelete && (
        <DeleteMemoryModal
          memory={memoryToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setMemoryToDelete(null);
          }}
          onConfirm={confirmDeleteMemory}
        />
      )}

      {photoViewerOpen && photoViewerMemory && photoViewerPhoto && (
        <PhotoViewerModal
          isOpen={photoViewerOpen}
          onClose={() => setPhotoViewerOpen(false)}
          memory={photoViewerMemory}
          selectedPhoto={photoViewerPhoto}
          onPhotoUpdate={updatedMemory => {
            setPhotoViewerMemory(updatedMemory);
          }}
        />
      )}
    </div>
  );
};

// Grid Layout with enhanced carousel controls and swipe support
interface GridMemoryCardProps {
  memory: Memory;
  recipes: { id: string; title: string }[];
  onContribute: (memory: Memory) => void;
  onViewDetails: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
  onPhotoClick?: (photo: Media, memory: Memory) => void;
}

const GridMemoryCard: React.FC<GridMemoryCardProps> = ({ memory, recipes, onContribute, onViewDetails, onDelete, isAdmin, onPhotoClick }) => {
  // Find the cover photo or default to first photo
  const coverPhotoIndex = memory.coverPhotoId 
    ? memory.media.findIndex(m => m.id === memory.coverPhotoId)
    : 0;
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(coverPhotoIndex >= 0 ? coverPhotoIndex : 0);
  const [isHovered, setIsHovered] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const photos = memory.media.filter(m => m.fileType === 'image');
  const videos = memory.media.filter(m => m.fileType === 'video');

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Auto-scroll (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % memory.media.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isMobile, memory.media.length]);

  const nextPhoto = () => {
    if (memory.media.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % memory.media.length);
    }
  };

  const prevPhoto = () => {
    if (memory.media.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + memory.media.length) % memory.media.length);
    }
  };

  // Touch handlers for swipe gestures (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isMobile || !touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 30;
    const isRightSwipe = distance < -30;
    if (isLeftSwipe && memory.media.length > 1) nextPhoto();
    if (isRightSwipe && memory.media.length > 1) prevPhoto();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // react-swipeable handlers for mobile
  const handlers = useSwipeable({
    onSwipedLeft: () => nextPhoto(),
    onSwipedRight: () => prevPhoto(),
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 20,
  });

  const displayTitle = memory.occasion === 'Holiday Meal' ? memory.holiday : memory.occasion;
  const latestNote = memory.notes.length > 0 ? memory.notes[memory.notes.length - 1] : null;

  // Gather all unique recipeIds from media
  const recipeIdsFromPhotos = Array.from(new Set(
    memory.media.flatMap(m => m.recipeIds || [])
  ));
  const recipeChips = recipeIdsFromPhotos
    .map(id => recipes.find(r => r.id === id))
    .filter(Boolean) as { id: string; title: string }[];

  return (
    <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Photo Section */}
          <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <div
              className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-pink-100 relative"
              {...(isMobile ? handlers : {})}
            >
              {memory.media.length > 0 ? (
                <>
                  {/* Show current media item (photo or video) */}
                  {memory.media[currentPhotoIndex]?.fileType === 'video' ? (
                    <VideoPlayer
                      src={memory.media[currentPhotoIndex]?.fileUrl}
                      caption={memory.media[currentPhotoIndex]?.caption}
                      className="w-full h-full"
                    />
                  ) : (
                    <img
                      src={memory.media[currentPhotoIndex]?.fileUrl}
                      alt={memory.media[currentPhotoIndex]?.caption || `${displayTitle} media ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-cover"
                      onClick={() => {
                        if (onPhotoClick) onPhotoClick(memory.media[currentPhotoIndex], memory);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                  {/* Recipe tag chips for current photo */}
                  {memory.media[currentPhotoIndex]?.recipeIds && memory.media[currentPhotoIndex].recipeIds.length > 0 && (
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
                      {memory.media[currentPhotoIndex].recipeIds.map((rid: string) => {
                        const recipe = recipes.find(r => r.id === rid);
                        return recipe ? (
                          <Badge key={rid} variant="secondary" className="bg-orange-200 text-orange-800 text-xs px-2 py-0.5">
                            {recipe.title}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  {/* Navigation arrows (desktop only) */}
                  {memory.media.length > 1 && !isMobile && (
                    <>
                      {/* Enhanced navigation buttons (desktop only) */}
                      <button
                        onClick={prevPhoto}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 ${
                          isHovered ? "opacity-100 scale-100" : "opacity-70 scale-90"
                        } hover:opacity-100 hover:scale-100`}
                        aria-label="Previous media"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 ${
                          isHovered ? "opacity-100 scale-100" : "opacity-70 scale-90"
                        } hover:opacity-100 hover:scale-100`}
                        aria-label="Next media"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      {/* Enhanced photo indicators */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
                        {memory.media.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                              index === currentPhotoIndex
                                ? "bg-white shadow-sm scale-110"
                                : "bg-white/60 hover:bg-white/80"
                            }`}
                            aria-label={`Go to media ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between relative">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-800">{displayTitle}</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    {format(parse(memory.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {photos.length > 0 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                    <Camera className="w-2 h-2 mr-1" />
                    {photos.length}
                  </Badge>
                )}
                {videos.length > 0 && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-xs">
                    <Video className="w-2 h-2 mr-1" />
                    {videos.length}
                  </Badge>
                )}
                
                {onDelete && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
                      onClick={() => setShowActionsMenu(!showActionsMenu)}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                    
                    {showActionsMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[100px]">
                        <button
                          onClick={() => {
                            setShowActionsMenu(false);
                            onDelete();
                          }}
                          className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* What we ate */}
            <div className="mt-2">
              <div className="text-sm font-semibold text-gray-700 mb-1">What we ate:</div>
              <div className="pl-2 text-sm text-gray-700">
                <div><span className="font-semibold">Meal:</span> {memory.meal || 'Not specified'}</div>
                <div><span className="font-semibold">Dessert:</span> {memory.dessert || 'Not specified'}</div>
              </div>
            </div>
            {/* Family recipes used */}
            {recipeChips.length > 0 && (
              <div className="mt-2">
                <div className="text-sm font-semibold text-gray-700 mb-1">Family recipes used:</div>
                <div className="flex flex-wrap gap-2">
                  {recipeChips.map(recipe => (
                    <button
                      key={recipe.id}
                      className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-orange-200 transition-colors shadow"
                      onClick={e => {
                        e.stopPropagation();
                        onViewDetails();
                        window.location.href = `/recipes/${recipe.id}`;
                      }}
                    >
                      {recipe.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-3 h-3" />
                <span className="text-xs">
                  {memory.attendees.join(', ')}
                  {memory.otherAttendees && `, ${memory.otherAttendees}`}
                </span>
              </div>
              {memory.celebration && (
                <div className="text-gray-700">
                  <span className="font-medium">Celebration:</span> {memory.celebration}
                </div>
              )}
              {memory.notes.length > 0 && (
                <div className="space-y-1">
                  {memory.notes.map((note) => (
                    <div key={note.id} className="text-gray-600 italic text-xs">
                      "{note.text}" - {note.authorName}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewDetails}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-transparent text-xs h-7"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Details
                </Button>
                <Button
                  size="sm"
                  onClick={() => onContribute(memory)}
                  className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white text-xs h-7"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Contribute
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};