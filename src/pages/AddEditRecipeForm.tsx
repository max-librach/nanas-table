import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNavigate, useParams } from 'react-router-dom';
import { Toast } from '../components/Toast';
import { createRecipe, getRecipeById, updateRecipe, deleteRecipe } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

// Custom styles for Quill editor
const quillStyles = `
  .quill-editor-wrapper {
    margin-bottom: 1.5rem;
  }
  .quill-editor-wrapper .ql-editor {
    min-height: 120px !important;
    max-height: 300px;
    overflow-y: auto;
  }
  .quill-editor-wrapper .ql-container {
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    border: 1px solid #d1d5db;
  }
  .quill-editor-wrapper .ql-toolbar {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    border: 1px solid #d1d5db;
    border-bottom: none;
  }
`;

// SVG icons for list buttons
const UnorderedListIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="5" cy="6" r="1.5" fill="currentColor"/><rect x="8" y="5" width="8" height="1.5" rx="0.75" fill="currentColor"/><circle cx="5" cy="10" r="1.5" fill="currentColor"/><rect x="8" y="9" width="8" height="1.5" rx="0.75" fill="currentColor"/><circle cx="5" cy="14" r="1.5" fill="currentColor"/><rect x="8" y="13" width="8" height="1.5" rx="0.75" fill="currentColor"/></svg>
);
const OrderedListIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><text x="3" y="8" fontSize="7" fill="currentColor">1.</text><rect x="8" y="5" width="8" height="1.5" rx="0.75" fill="currentColor"/><text x="3" y="13" fontSize="7" fill="currentColor">2.</text><rect x="8" y="9" width="8" height="1.5" rx="0.75" fill="currentColor"/><text x="3" y="18" fontSize="7" fill="currentColor">3.</text><rect x="8" y="13" width="8" height="1.5" rx="0.75" fill="currentColor"/></svg>
);

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

export const AddEditRecipeForm: React.FC = () => {
  const { recipeId } = useParams();
  const isEdit = Boolean(recipeId);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(isEdit);
  const [recipeDocId, setRecipeDocId] = useState<string | null>(null);

  // Pre-fill fields on edit
  React.useEffect(() => {
    if (isEdit && recipeId) {
      setLoading(true);
      getRecipeById(recipeId).then(recipe => {
        if (recipe) {
          setTitle(recipe.title);
          setInstructions(recipe.instructions);
          setTags(recipe.tags || []);
          // TODO: handle photoUrls if needed
          setRecipeDocId(recipe.id);
        }
        setLoading(false);
      });
    }
  }, [isEdit, recipeId]);

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleSelectTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotoFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    if (!user) {
      setToast({ message: 'You must be signed in to save a recipe.', type: 'error' });
      return;
    }
    const slug = slugify(title);
    try {
      const recipeData = {
        title: title.trim(),
        instructions: instructions.trim(),
        tags,
        createdBy: user.id,
        createdByName: user.displayName,
        createdAt: new Date().toISOString(),
        photoUrls: [], // Add photo upload logic if needed
        slug
      };
      if (isEdit && recipeDocId) {
        await updateRecipe(recipeDocId, recipeData);
        setToast({ message: 'Recipe updated!', type: 'success' });
      } else {
        await createRecipe(recipeData);
        setToast({ message: 'Recipe saved!', type: 'success' });
      }
      setTimeout(() => navigate(`/recipes/${slug}`), 1000);
    } catch (error) {
      setToast({ message: 'Failed to save recipe. Please try again.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !recipeDocId) return;
    if (!window.confirm('Are you sure you want to delete this recipe? This cannot be undone.')) return;
    try {
      await deleteRecipe(recipeDocId);
      setToast({ message: 'Recipe deleted.', type: 'success' });
      setTimeout(() => navigate('/recipes'), 1000);
    } catch (error) {
      setToast({ message: 'Failed to delete recipe. Please try again.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <style>{quillStyles}</style>
      {/* Header overlay with back button and page title */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
            onClick={() => navigate('/recipes')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-lg font-bold text-gray-800 ml-2">{isEdit ? 'Edit Recipe' : 'Add a Recipe'}</h1>
          {isEdit && user && (
            <button
              type="button"
              className="ml-auto bg-red-50 text-red-600 border border-red-200 rounded px-4 py-2 font-medium hover:bg-red-100"
              onClick={handleDelete}
            >Delete</button>
          )}
        </div>
      </div>
      <div className="max-w-xl mx-auto px-4 py-8">
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading recipe...</div>
        ) : (
        <form
          className="bg-white rounded-2xl shadow-lg w-full p-8 space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Title */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Recipe Title <span className="text-rose-500">*</span></label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-400"
              placeholder="e.g. Nana's Bananas"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Instructions (rich text editor) */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Instructions <span className="text-rose-500">*</span></label>
            <div className="quill-editor-wrapper">
              <ReactQuill
                value={instructions}
                onChange={setInstructions}
                placeholder="List ingredients, steps, and any tips"
                className="bg-white"
                theme="snow"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Recipe Category</label>
            <div className="flex flex-col sm:flex-row gap-2 mb-2 w-full">
              <select
                className="border border-gray-300 rounded px-2 py-1 w-full sm:w-auto"
                onChange={e => handleSelectTag(e.target.value)}
                value=""
              >
                <option value="">Select existing category</option>
                {/* Add your tags here */}
              </select>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  className="border border-gray-300 rounded px-2 py-1 w-full sm:w-auto"
                  placeholder="e.g. Sukkot; Dessert"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                />
                <button
                  type="button"
                  className="bg-orange-400 text-white px-3 py-1 rounded w-full sm:w-auto"
                  onClick={handleAddTag}
                >Add</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.map(tag => (
                <span key={tag} className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  {tag}
                  <button type="button" className="ml-1 text-orange-500 hover:text-orange-700" onClick={() => handleRemoveTag(tag)}>&times;</button>
                </span>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Recipe Photos</label>
            <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 flex flex-col items-center justify-center text-orange-500 bg-orange-50">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
                <span className="text-3xl mb-2">📷</span>
                <span>Add photos of your dish</span>
              </label>
              {photoFiles.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">{photoFiles.length} file(s) selected</div>
              )}
            </div>
          </div>

          {/* Save/Cancel */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-500 hover:to-pink-600 transition-colors flex items-center justify-center gap-2"
            >
              <span role="img" aria-label="save">💾</span> Save Recipe
            </button>
            <button
              type="button"
              className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}; 