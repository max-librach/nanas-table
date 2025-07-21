import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Camera, Cake, Heart, Users, Video, Utensils, MessageCircle, Edit, Plus, Trash2, MoreVertical, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { VideoPlayer } from '../components/VideoPlayer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Memory, Media } from '../types';
import { ContributionModal } from '../components/ContributionModal';
import { DeleteMemoryModal } from '../components/DeleteMemoryModal';
import { getMemory, deleteMemory as deleteMemoryFromDB, updateMemory, getMemoryByEventCode, getAllRecipes } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { PhotoViewerModal } from '../components/PhotoViewerModal';

export const MemoryDetailsPage: React.FC = () => {
  const { eventCode } = useParams<{ eventCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [recipes, setRecipes] = useState<{ id: string; title: string }[]>([]);
  const [showContribution, setShowContribution] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Media | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Check if current user is Max (admin)
  const isAdmin = user?.email === 'maxlibrach@gmail.com';

  useEffect(() => {
    if (eventCode) {
      loadMemory();
    }
    getAllRecipes().then(setRecipes);
  }, [eventCode]);

  // Click-away handler for delete action menu
  useEffect(() => {
    if (!showActionsMenu) return;
    function handleClick(e: MouseEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showActionsMenu]);

  const loadMemory = async () => {
    if (!eventCode) return;
    try {
      setLoading(true);
      const memoryData = await getMemoryByEventCode(eventCode);
      setMemory(memoryData);
    } catch (error) {
      console.error('Error loading memory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = () => {
    if (memory) {
      deleteMemoryFromDB(memory.id)
        .then(() => {
          setShowDeleteModal(false);
          setShowActionsMenu(false);
          navigate('/');
        })
        .catch((error) => {
          console.error('Error deleting memory:', error);
        });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-400"></div>
        </div>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Memory not found</h2>
            <Button 
              className="bg-gradient-to-r from-orange-400 to-pink-400 text-white"
              onClick={() => navigate('/')}
            >
              Back to Timeline
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const photoCount = memory.media.filter(m => m.fileType === 'image').length;
  const videoCount = memory.media.filter(m => m.fileType === 'video').length;

  // Gather all unique recipeIds from media
  const recipeIdsFromPhotos = Array.from(new Set(
    memory.media.flatMap(m => m.recipeIds || [])
  ));
  const recipeChips = recipeIdsFromPhotos
    .map(id => recipes.find(r => r.id === id))
    .filter(Boolean) as { id: string; title: string }[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header overlay with back button and page title */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
            onClick={() => navigate('/')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-lg font-bold text-gray-800 ml-2">{memory.occasion === 'Holiday Meal' ? memory.holiday : memory.occasion}</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{memory.occasion === 'Holiday Meal' ? memory.holiday : memory.occasion}</h1>
              <div className="text-gray-500 text-sm">Created by {memory.createdByName} on {new Date(memory.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          {/* Only one delete button in the action menu for admin/owner */}
          {(isAdmin || user?.email === memory.createdBy) && (
            <div className="relative" ref={actionsMenuRef}>
              <button
                className="bg-orange-50 text-orange-600 border border-orange-200 rounded px-4 py-2 font-medium hover:bg-orange-100"
                onClick={() => setShowActionsMenu((open) => !open)}
              >
                More
              </button>
              {showActionsMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      handleDeleteMemory();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-700 hover:bg-orange-50 hover:text-red-800 transition-colors text-left"
                  >
                    Delete Memory
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail card */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gray-800">
                      {memory.occasion === 'Holiday Meal' ? memory.holiday : memory.occasion}
                    </CardTitle>
                    <CardDescription
                      className="text-lg text-gray-600 whitespace-nowrap"
                      title={format(new Date(memory.date), 'EEEE, MMMM d, yyyy')}
                    >
                      {format(new Date(memory.date), 'EEEE, MMM d, yyyy')}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Attendees */}
              <Section icon={<Users className="w-5 h-5 text-gray-600" />} title="Who was there">
                {memory.attendees.join(', ')}
                {memory.otherAttendees && `, ${memory.otherAttendees}`}
              </Section>

              {/* Food */}
              <Section icon={<Utensils className="w-5 h-5 text-gray-600" />} title="What we ate">
                <div className="pl-2">
                  <div><span className="font-semibold">Meal:</span> {memory.meal || (memory as any).food || 'Not specified'}</div>
                  <div><span className="font-semibold">Dessert:</span> {memory.dessert || 'Not specified'}</div>
                </div>
              </Section>

              {/* Recipes used in this event */}
              {recipeChips.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Utensils className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Recipes used in this event</h3>
                  </div>
                  <div className="space-y-4">
                    {recipeChips.map(recipe => {
                      const taggedPhotos = memory.media.filter(
                        m => m.fileType === 'image' && m.recipeIds && m.recipeIds.includes(recipe.id)
                      );
                      return (
                        <div key={recipe.id}>
                          <button
                            className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-orange-200 transition-colors shadow mb-2"
                            onClick={() => navigate(`/recipes/${recipe.slug}`)}
                          >
                            {recipe.title}
                          </button>
                          {taggedPhotos.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-2">
                              {taggedPhotos.map(photo => (
                                <img
                                  key={photo.id}
                                  src={photo.fileUrl}
                                  alt={photo.caption || recipe.title}
                                  className="w-20 h-20 object-cover rounded-lg cursor-pointer border border-orange-100 hover:opacity-80 transition"
                                  onClick={() => {
                                    setSelectedPhoto(photo);
                                    setShowPhotoViewer(true);
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Celebration */}
              {memory.celebration && (
                <Section icon={<Cake className="w-5 h-5 text-gray-600" />} title="Special celebration">
                  {memory.celebration}
                </Section>
              )}

              {/* Notes */}
              {memory.notes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Memory notes</h3>
                  </div>
                  <div className="space-y-3">
                    {memory.notes.map((note) => (
                      <div key={note.id} className="text-gray-700 bg-gray-50 rounded-lg p-3">
                        <span className="italic">
                          "{note.text}" – {note.authorName}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(note.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media */}
              {memory.media.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Camera className="w-5 h-5 text-gray-600" />
                      <Video className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Photos & Videos</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {memory.media.map((media) => (
                      <div key={media.id} className="relative group">
                        {media.fileType === 'video' ? (
                          <VideoPlayer
                            src={media.fileUrl}
                            caption={media.caption}
                            className="w-full aspect-square"
                          />
                        ) : (
                          <img
                            src={media.fileUrl}
                            alt={media.caption || ''}
                            className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setSelectedPhoto(media);
                              setShowPhotoViewer(true);
                            }}
                          />
                        )}
                        
                        {/* Media info overlay (for images) */}
                        {media.fileType === 'image' && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                            {media.caption && (
                              <p className="text-white text-xs font-medium">{media.caption}</p>
                            )}
                            <p className="text-white/80 text-xs">
                              by {media.uploadedByName}
                            </p>
                          </div>
                        )}
                        
                        {/* Video info is handled by VideoPlayer component */}
                        {media.fileType === 'video' && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                              by {media.uploadedByName}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contribute Button */}
              <div className="border-t pt-6">
                <Button
                  onClick={() => setShowContribution(true)}
                  className="w-full bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-medium py-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Contribute to this memory
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        {showContribution && (
          <ContributionModal
            memory={memory}
            onClose={() => setShowContribution(false)}
            onSubmit={() => {
              setShowContribution(false);
              loadMemory(); // Refresh memory to show new contributions
            }}
          />
        )}

        {showDeleteModal && memory && (
          <DeleteMemoryModal
            memory={memory}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteMemory}
          />
        )}

        {showPhotoViewer && selectedPhoto && memory && (
          <PhotoViewerModal
            isOpen={showPhotoViewer}
            onClose={() => {
              setShowPhotoViewer(false);
              setSelectedPhoto(null);
            }}
            memory={memory}
            selectedPhoto={selectedPhoto}
            onPhotoUpdate={(updatedMemory) => setMemory(updatedMemory)}
          />
        )}
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------------- */
/* ―― helper components ――                                                   */
/* ----------------------------------------------------------------------- */

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        {icon}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="text-gray-700 bg-gray-50 rounded-lg p-3">{children}</div>
    </div>
  );
}

function Placeholder({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="aspect-square rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
      {icon}
    </div>
  );
}