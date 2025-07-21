import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRecipeById, getMediaByRecipeId } from '../services/firebaseService';

export const RecipeDetailPage: React.FC = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (!recipeId) return;
    setLoading(true);
    Promise.all([
      getRecipeById(recipeId),
      getMediaByRecipeId(recipeId)
    ]).then(([recipeData, mediaData]) => {
      setRecipe(recipeData);
      setPhotos(mediaData);
      setLoading(false);
    });
  }, [recipeId]);

  const handlePostComment = () => {
    if (comment.trim()) {
      setComments([
        ...comments,
        { id: Math.random().toString(), author: 'You', text: comment, date: new Date().toLocaleDateString() },
      ]);
      setComment('');
    }
  };

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
            onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
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
          <h2 className="font-semibold text-gray-700 mb-2">Photos</h2>
          <div className="flex gap-4 flex-wrap">
            {recipe.photoUrls && recipe.photoUrls.length > 0 && recipe.photoUrls.map((url: string, i: number) => (
              <img key={i} src={url} alt={`Recipe photo ${i + 1}`} className="rounded-lg w-40 h-32 object-cover bg-gray-100" />
            ))}
            {photos.map((photo, i) => (
              <img key={photo.id} src={photo.fileUrl} alt={photo.caption || `Recipe photo ${i + 1}`} className="rounded-lg w-40 h-32 object-cover bg-gray-100" />
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
        {/* Comments */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><span role="img" aria-label="comments">💬</span> Comments</h2>
          <div className="space-y-2 mb-2">
            {comments.map(c => (
              <div key={c.id} className="bg-orange-50 rounded-lg px-4 py-2 text-sm text-gray-800">
                <span className="font-semibold text-orange-700 mr-2">{c.author}</span>
                {c.text}
                <span className="text-xs text-gray-400 ml-2">{c.date}</span>
              </div>
            ))}
          </div>
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
            >Post</button>
          </div>
        </div>
      </div>
    </div>
  );
}; 