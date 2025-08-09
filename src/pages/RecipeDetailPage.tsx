import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRecipeBySlug, getMediaByRecipeId, getMemoriesByRecipeId, getMemory, getRecipeComments, addRecipeComment, updateRecipe } from '../services/firebaseService';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export const RecipeDetailPage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [memories, setMemories] = useState<any[]>([]);
  const { user } = useAuth();
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getRecipeBySlug(slug).then(recipeData => {
      setRecipe(recipeData);
      if (recipeData) {
        Promise.all([
          getMediaByRecipeId(recipeData.id),
          getMemoriesByRecipeId(recipeData.id)
        ]).then(async ([mediaData, memoriesData]) => {
          setPhotos(mediaData);
          // Find all unique memoryIds from media tagged with this recipe
          const mediaMemoryIds = Array.from(new Set(mediaData.map(m => m.memoryId).filter(Boolean)));
          // Fetch those memories
          const mediaMemories = await Promise.all(mediaMemoryIds.map(id => getMemory(id as string)));
          // Merge with memoriesData (avoid duplicates by id)
          const allMemoriesMap: { [id: string]: any } = {};
          for (const mem of [...memoriesData, ...mediaMemories]) {
            if (mem && mem.id) allMemoriesMap[mem.id] = mem;
          }
          // For each memory, attach its tagged photos
          const allMemories = Object.values(allMemoriesMap).map(mem => {
            // Deduplicate tagged photos by id
            const tagged = (mem.media || []).filter((m: any) => m.recipeIds && m.recipeIds.includes(recipeData.id))
              .concat(mediaData.filter(m => m.memoryId === mem.id && m.recipeIds && m.recipeIds.includes(recipeData.id)));
            const uniquePhotos: { [id: string]: any } = {};
            for (const p of tagged) { if (p && p.id) uniquePhotos[p.id] = p; }
            return {
              ...mem,
              taggedPhotos: Object.values(uniquePhotos)
            };
          });
          setMemories(allMemories);
          setLoading(false);
        });
      } else {
        setPhotos([]);
        setMemories([]);
        setLoading(false);
      }
    });
  }, [slug]);

  // Fetch comments when recipe is loaded
  useEffect(() => {
    if (!recipe || !recipe.id) return;
    setCommentsLoading(true);
    getRecipeComments(recipe.id).then(commentsData => {
      setComments(commentsData);
      setCommentsLoading(false);
    });
  }, [recipe]);

  const handlePostComment = async () => {
    setCommentError(null);
    if (!user) return;
    if (comment.trim() && recipe && recipe.id) {
      const newComment = {
        recipeId: recipe.id,
        authorId: user.id,
        authorName: user.displayName,
        text: comment.trim(),
        timestamp: new Date().toISOString(),
      };
      setComment('');
      try {
        await addRecipeComment(recipe.id, user.id, user.displayName, newComment.text);
        // Re-fetch comments
        const commentsData = await getRecipeComments(recipe.id);
        setComments(commentsData);
      } catch (err) {
        setCommentError('Failed to save comment. Please try again.');
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !recipe || !user) return;

    try {
      const uploadPromises = files.map(async (file) => {
        // Upload to Firebase Storage
        const fileName = `recipes/${recipe.id}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        return downloadURL;
      });

      const newPhotoUrls = await Promise.all(uploadPromises);
      
      // Update recipe with new photo URLs
      const updatedPhotoUrls = [...(recipe.photoUrls || []), ...newPhotoUrls];
      await updateRecipe(recipe.id, { photoUrls: updatedPhotoUrls });
      
      // Update local state
      setRecipe((prev: any) => ({ ...prev, photoUrls: updatedPhotoUrls }));
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos. Please try again.');
    }
  };

  const handleSetCoverPhoto = async (photoUrl: string) => {
    if (!recipe || !user) return;

    try {
      // Update recipe with new cover photo URL
      await updateRecipe(recipe.id, { coverPhotoUrl: photoUrl });
      
      // Update local state
      setRecipe((prev: any) => ({ ...prev, coverPhotoUrl: photoUrl }));
    } catch (error) {
      console.error('Error setting cover photo:', error);
      alert('Failed to set cover photo. Please try again.');
    }
  };

  // Helper to format YYYY-MM-DD as Month Day, Year
  function formatDateString(dateStr: string | undefined) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return format(d, 'MMMM d, yyyy');
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 text-gray-500">Loading recipe...</div>;
  }
  if (!recipe) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 text-gray-500">Recipe not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header overlay with back button and page title */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/recipes');
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-lg font-bold text-gray-800 ml-2">{recipe.title}</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8">
        {/* Header info */}
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-orange-100 text-orange-600 rounded-full p-2 text-2xl" title="Recipe">🧑‍🍳</span>
          <div>
            <div className="text-gray-500 text-sm">Created by {recipe.createdByName || 'Unknown'} on {recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString() : 'Unknown date'}</div>
          </div>
          <button
            className="ml-auto bg-orange-50 text-orange-600 border border-orange-200 rounded px-4 py-2 font-medium hover:bg-orange-100"
            onClick={() => navigate(`/recipes/${recipe.slug}/edit`)}
          >Edit</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {recipe.tags && recipe.tags.map((tag: string) => (
            <span key={tag} className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-1" />
              {tag}
            </span>
          ))}
        </div>
        {/* Photos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-700">Photos</h2>
            {user && (
              <div>
                <input
                  type="file"
                  id="recipe-photo-upload"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <label
                  htmlFor="recipe-photo-upload"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-1 rounded cursor-pointer inline-flex items-center gap-1"
                >
                  📷 Add Photos
                </label>
              </div>
            )}
          </div>
          <div className="flex gap-4 flex-wrap">
            {recipe.photoUrls && recipe.photoUrls.length > 0 && recipe.photoUrls.map((url: string, i: number) => (
              <div key={i} className="relative group">
                <img 
                  src={url} 
                  alt={`Recipe photo ${i + 1}`} 
                  className="rounded-lg w-40 h-32 object-cover bg-gray-100" 
                />
                {recipe.coverPhotoUrl === url && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                    Cover
                  </div>
                )}
                {user && recipe.coverPhotoUrl !== url && (
                  <button
                    onClick={() => handleSetCoverPhoto(url)}
                    className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Set as Cover
                  </button>
                )}
              </div>
            ))}
            {photos.map((photo, i) => (
              <div key={photo.id} className="relative group">
                <img 
                  src={photo.fileUrl} 
                  alt={photo.caption || `Recipe photo ${i + 1}`} 
                  className="rounded-lg w-40 h-32 object-cover bg-gray-100" 
                />
                {recipe.coverPhotoUrl === photo.fileUrl && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                    Cover
                  </div>
                )}
                {user && recipe.coverPhotoUrl !== photo.fileUrl && (
                  <button
                    onClick={() => handleSetCoverPhoto(photo.fileUrl)}
                    className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Set as Cover
                  </button>
                )}
              </div>
            ))}
            {(!recipe.photoUrls || recipe.photoUrls.length === 0) && photos.length === 0 && (
              <span className="text-gray-400">No photos yet.</span>
            )}
          </div>
        </div>
        {/* Instructions */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><span role="img" aria-label="instructions">🍴</span> Instructions</h2>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: recipe.instructions }} />
        </div>
        {/* Used in Events */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><span role="img" aria-label="calendar">📅</span> Used in Events</h2>
          {memories.length === 0 ? (
            <div className="text-gray-400">This recipe hasn't been used in any events yet.</div>
          ) : (
            <div className="space-y-6">
              {memories.map(mem => (
                <div key={mem.id} className="bg-orange-50 rounded-lg p-4">
                  <div className="font-semibold text-orange-700 mb-1">
                    <a href={`/memory/${mem.eventCode || mem.id}`} className="hover:underline">
                      {mem.occasion}{mem.holiday ? `: ${mem.holiday}` : ''} ({formatDateString(mem.date)})
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {mem.taggedPhotos && mem.taggedPhotos.length > 0 ? (
                      mem.taggedPhotos.map((m: any) => (
                        <img key={m.id} src={m.fileUrl} alt={m.caption || ''} className="rounded-lg w-32 h-24 object-cover bg-gray-100" />
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No tagged photos in this event.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Comments */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><span role="img" aria-label="comments">💬</span> Comments</h2>
          {commentsLoading ? (
            <div className="text-gray-400">Loading comments...</div>
          ) : (
            <div className="space-y-2 mb-2">
              {comments.length === 0 ? (
                <div className="text-gray-400">No comments yet.</div>
              ) : comments.map((c: any) => (
                <div key={c.id} className="bg-orange-50 rounded-lg px-4 py-2 text-sm text-gray-800">
                  <span className="font-semibold text-orange-700 mr-2">{c.authorName}</span>
                  {c.text}
                  <span className="text-xs text-gray-400 ml-2">{c.timestamp ? format(new Date(c.timestamp), 'MMM d, yyyy h:mm a') : ''}</span>
                </div>
              ))}
            </div>
          )}
          {commentError && <div className="text-red-600 text-sm mb-2">{commentError}</div>}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="flex-1 border border-orange-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="Add a comment..."
            />
            <button
              onClick={handlePostComment}
              className="bg-orange-500 text-white px-4 py-2 rounded font-semibold hover:bg-orange-600 transition"
              disabled={!user || !comment.trim()}
            >Post</button>
          </div>
        </div>
      </div>
    </div>
  );
}; 