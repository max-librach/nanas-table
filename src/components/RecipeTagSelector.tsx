import React, { useState, useRef } from 'react';

interface Recipe {
  id: string;
  title: string;
}

interface RecipeTagSelectorProps {
  allRecipes: Recipe[];
  selectedRecipeIds: string[];
  onChange: (recipeIds: string[]) => void;
  hideCheckbox?: boolean;
}

export const RecipeTagSelector: React.FC<RecipeTagSelectorProps> = ({ allRecipes, selectedRecipeIds, onChange, hideCheckbox }) => {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(selectedRecipeIds.length > 0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync enabled state with selectedRecipeIds prop
  React.useEffect(() => {
    if (selectedRecipeIds.length > 0 && !enabled) {
      setEnabled(true);
    } else if (selectedRecipeIds.length === 0 && enabled) {
      setEnabled(false);
    }
  }, [selectedRecipeIds.length]);

  // Click-away handler for dropdown
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleCheck = (id: string) => {
    if (selectedRecipeIds.includes(id)) {
      onChange(selectedRecipeIds.filter(rid => rid !== id));
    } else {
      onChange([...selectedRecipeIds, id]);
    }
    // Do not close dropdown here; let it close on outside click or explicit close
  };

  const handleToggleEnabled = () => {
    setEnabled((prev) => {
      const next = !prev;
      if (!next) onChange([]); // Clear tags if unchecked
      setOpen(next);
      return next;
    });
  };

  if (hideCheckbox) {
    return (
      <div className="relative">
        {selectedRecipeIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedRecipeIds.map(id => {
              const recipe = allRecipes.find(r => r.id === id);
              if (!recipe) return null;
              return (
                <span key={id} className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  {recipe.title}
                  <button type="button" className="ml-1 text-orange-500 hover:text-orange-700" onClick={() => handleCheck(id)}>&times;</button>
                </span>
              );
            })}
          </div>
        )}
        <div className="mb-2 font-semibold text-gray-800 text-sm">Select recipes:</div>
        <div className="bg-white border border-gray-200 rounded-md p-2 max-h-48 overflow-y-auto flex flex-col gap-1">
          {allRecipes.map(recipe => (
            <label key={recipe.id} className="flex items-center gap-2 cursor-pointer text-sm py-1">
              <input
                type="checkbox"
                checked={selectedRecipeIds.includes(recipe.id)}
                onChange={() => handleCheck(recipe.id)}
                className="accent-orange-500 w-4 h-4"
              />
              <span>{recipe.title}</span>
            </label>
          ))}
          {allRecipes.length === 0 && (
            <div className="text-xs text-gray-400">No recipes available</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedRecipeIds.map(id => {
          const recipe = allRecipes.find(r => r.id === id);
          if (!recipe) return null;
          return (
            <span key={id} className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              {recipe.title}
              <button type="button" className="ml-1 text-orange-500 hover:text-orange-700" onClick={() => handleCheck(id)}>&times;</button>
            </span>
          );
        })}
      </div>
      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none mb-1">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggleEnabled}
          className="accent-orange-500"
        />
        Tag this photo with a family recipe
      </label>
      {enabled && open && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mb-2 bg-white border border-gray-200 rounded shadow-lg p-3 w-64 bottom-full left-0"
          style={{ minHeight: 40 }}
        >
          <div className="mb-2 text-sm font-medium text-gray-700">Select recipes:</div>
          <div className="max-h-48 overflow-y-auto flex flex-col gap-2">
            {allRecipes.map(recipe => (
              <label key={recipe.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRecipeIds.includes(recipe.id)}
                  onChange={() => handleCheck(recipe.id)}
                  className="accent-orange-500"
                />
                <span>{recipe.title}</span>
              </label>
            ))}
            {allRecipes.length === 0 && (
              <div className="text-xs text-gray-400">No recipes available</div>
            )}
          </div>
        </div>
      )}
      {enabled && !open && (
        <button
          type="button"
          className="text-xs px-3 py-1 rounded bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 font-medium mt-2"
          onClick={() => setOpen(true)}
        >
          {selectedRecipeIds.length > 0 ? 'Edit tags' : 'Tag a Family Recipe'}
        </button>
      )}
    </div>
  );
}; 