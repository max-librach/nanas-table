import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toast } from '../components/Toast';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getAllRecipes, getMediaByRecipeId } from '../services/firebaseService';

export const RecipesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [thumbnails, setThumbnails] = useState<{ [recipeId: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [thumbsLoading, setThumbsLoading] = useState(true);

  useEffect(() => {
    if (location.state && (location.state as any).toast) {
      setToast((location.state as any).toast);
      // Remove toast from history state so it doesn't show again on back/forward
      window.history.replaceState({}, document.title);
    }
    // Fetch recipes from Firestore
    getAllRecipes().then(async (data) => {
      setRecipes(data);
      setLoading(false);
      // For recipes with no photoUrls, fetch first tagged photo
      const thumbPromises = data.map(async (recipe: any) => {
        if (recipe.photoUrls && recipe.photoUrls.length > 0) return;
        const media = await getMediaByRecipeId(recipe.id);
        if (media && media.length > 0) {
          return { recipeId: recipe.id, url: media[0].fileUrl };
        }
        return null;
      });
      const thumbResults = await Promise.all(thumbPromises);
      const thumbMap: { [recipeId: string]: string } = {};
      thumbResults.forEach(res => {
        if (res && res.recipeId && res.url) thumbMap[res.recipeId] = res.url;
      });
      setThumbnails(thumbMap);
      setThumbsLoading(false);
    });
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Family Recipes</h2>
            <p className="text-gray-600">Delicious dishes and cherished traditions</p>
          </div>
          <Button
            onClick={() => navigate('/recipes/new')}
            className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-medium py-3 px-4 sm:px-6 flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add New Recipe
          </Button>
        </div>
        {loading || thumbsLoading ? (
          <div className="text-center text-gray-500 py-12">Loading recipes...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No recipes found. Add your first family recipe!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {recipes.map(recipe => (
              <div
                key={recipe.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition cursor-pointer"
                onClick={() => navigate(`/recipes/${recipe.slug}`)}
              >
                <div className="h-40 bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                  {/* Show cover photo if set, otherwise first photo, otherwise tagged photo */}
                  {recipe.coverPhotoUrl ? (
                    <img src={recipe.coverPhotoUrl} alt={recipe.title} className="h-full w-full object-cover" />
                  ) : recipe.photoUrls && recipe.photoUrls.length > 0 ? (
                    <img src={recipe.photoUrls[0]} alt={recipe.title} className="h-full w-full object-cover" />
                  ) : thumbnails[recipe.id] ? (
                    <img src={thumbnails[recipe.id]} alt={recipe.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg text-gray-400">{recipe.title}</span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="font-bold text-lg text-gray-800 mb-2">{recipe.title}</h2>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {recipe.tags && recipe.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      >
                        <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}; 