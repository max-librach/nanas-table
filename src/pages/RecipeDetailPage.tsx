import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const mockRecipe = {
  id: '1',
  title: "Nana's Famous Challah",
  instructions: `<strong>Ingredients:</strong><br/>- 1.5 cups warm water<br/>- 2 tsp active dry yeast<br/>- 1/2 cup sugar<br/>- 1/4 cup vegetable oil<br/>- 2 large eggs<br/>- 1 tsp salt<br/>- 4.5-5 cups all-purpose flour<br/><br/><strong>Instructions:</strong><ol><li>Dissolve yeast and 1 tsp sugar in warm water. Let sit 5 minutes until foamy.</li><li>Stir in remaining sugar, oil, eggs, and salt. Gradually add flour, mixing until a soft dough forms.</li><li>Knead on a lightly floured surface for 8-10 minutes until smooth and elastic.</li><li>Place dough in a greased bowl, cover, and let rise in a warm place for 1-1.5 hours, or until doubled.</li><li>Punch down dough, divide into 3 or 6 pieces, and braid.</li><li>Place on a greased baking sheet, cover, and let rise for another 30-45 minutes.</li><li>Preheat oven to 375°F (190°C). Brush challah with egg wash (1 egg beaten with 1 tbsp water).</li><li>Bake for 25-35 minutes, or until golden brown and cooked through.</li></ol>`,
  tags: ['Bread', 'Shabbat', 'Holiday', 'Jewish'],
  createdByName: 'Nana',
  createdAt: '2023-03-10',
  photoUrls: [
    'https://placehold.co/200x150?text=Recipe+photo+1',
    'https://placehold.co/200x150?text=Recipe+photo+2',
  ],
};

const mockMemories = [
  { id: 'm1', title: 'Shabbat Dinner', date: 'Jan 14, 2024' },
  { id: 'm2', title: 'Shabbat Dinner', date: 'Jan 2024' },
];

const mockPhotos = [
  { id: 'p1', url: 'https://placehold.co/200x150?text=Recipe+photo+1', memory: mockMemories[0] },
  { id: 'p2', url: 'https://placehold.co/200x150?text=Recipe+photo+2', memory: mockMemories[1] },
];

const mockComments = [
  { id: 'c1', author: 'Giliah', text: 'This is the best challah ever!', date: 'Mar 12, 2023' },
  { id: 'c2', author: 'Erez', text: 'Always a hit at Shabbat dinner.', date: 'Mar 15, 2023' },
];

export const RecipeDetailPage: React.FC = () => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(mockComments);
  const navigate = useNavigate();

  const handlePostComment = () => {
    if (comment.trim()) {
      setComments([
        ...comments,
        { id: Math.random().toString(), author: 'You', text: comment, date: new Date().toLocaleDateString() },
      ]);
      setComment('');
    }
  };

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
          <h1 className="text-lg font-bold text-gray-800 ml-2">{mockRecipe.title}</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8">
        {/* Header info */}
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-orange-100 text-orange-600 rounded-full p-2 text-2xl" title="Recipe">🧑‍🍳</span>
          <div>
            <div className="text-gray-500 text-sm">Created by {mockRecipe.createdByName} on {new Date(mockRecipe.createdAt).toLocaleDateString()}</div>
          </div>
          <button
            className="ml-auto bg-orange-50 text-orange-600 border border-orange-200 rounded px-4 py-2 font-medium hover:bg-orange-100"
            onClick={() => navigate(`/recipes/${mockRecipe.id}/edit`)}
          >Edit</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {mockRecipe.tags.map(tag => (
            <span key={tag} className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-1" />
              {tag}
            </span>
          ))}
        </div>
        {/* Photos */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-2">Photos</h2>
          <div className="flex gap-4">
            {mockRecipe.photoUrls.map((url, i) => (
              <img key={i} src={url} alt={`Recipe photo ${i + 1}`} className="rounded-lg w-40 h-32 object-cover bg-gray-100" />
            ))}
          </div>
        </div>
        {/* Instructions */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><span role="img" aria-label="instructions">🍴</span> Instructions</h2>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: mockRecipe.instructions }} />
        </div>
        {/* Used in Memories */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><span role="img" aria-label="calendar">📅</span> Used in Memories</h2>
          <div className="flex flex-wrap gap-2">
            {mockMemories.map(mem => (
              <span key={mem.id} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-pink-200">
                {mem.title} ({mem.date})
              </span>
            ))}
          </div>
        </div>
        {/* Tagged Photos */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><span role="img" aria-label="camera">📷</span> Tagged Photos</h2>
          <div className="flex gap-4">
            {mockPhotos.map(photo => (
              <div key={photo.id} className="flex flex-col items-center">
                <img src={photo.url} alt="Tagged" className="rounded-lg w-32 h-24 object-cover bg-gray-100" />
                <span className="text-xs text-gray-500 mt-1 text-center">
                  From {photo.memory.title}<br />
                  ({photo.memory.date})
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Comments */}
        <div className="mb-2">
          <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><span role="img" aria-label="comments">💬</span> Comments ({comments.length})</h2>
          <div className="space-y-3 mb-3">
            {comments.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className="bg-orange-200 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                  {c.author[0]}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{c.author}</div>
                  <div className="text-gray-700 text-sm">{c.text}</div>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">{c.date}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-400"
              placeholder="Add a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button
              className="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-500 hover:to-pink-600 transition"
              onClick={handlePostComment}
              type="button"
            >
              Post Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 