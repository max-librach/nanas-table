import React, { useState } from 'react';
import { X, Camera, MessageSquare } from 'lucide-react';
import { Memory } from '../types';
import { Toast } from './Toast';
import { addContribution, uploadMultipleMedia } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

interface ContributionModalProps {
  memory: Memory;
  onClose: () => void;
  onSubmit: () => void;
}

export const ContributionModal: React.FC<ContributionModalProps> = ({ memory, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [media, setMedia] = useState<File[]>([]);
  const [mediaCaptions, setMediaCaptions] = useState<string[]>([]);
  const [mediaProgress, setMediaProgress] = useState<number[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMedia(prev => [...prev, ...files]);
    setMediaCaptions(prev => [...prev, ...files.map(() => '')]);
    setMediaProgress(prev => [...prev, ...files.map(() => 0)]);
  };

  const handleMediaCaptionChange = (index: number, caption: string) => {
    setMediaCaptions(prev => prev.map((c, i) => i === index ? caption : c));
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
    setMediaCaptions(prev => prev.filter((_, i) => i !== index));
    setMediaProgress(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!note.trim() && media.length === 0) {
      setToast({ message: 'Please add a note or upload media', type: 'error' });
      return;
    }

    if (!user) {
      setToast({ message: 'You must be signed in to contribute', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload media in parallel with progress
      let uploadedMediaIds: string[] = [];
      if (media.length > 0) {
        uploadedMediaIds = await uploadMultipleMedia(
          media,
          memory.id,
          mediaCaptions,
          user.id,
          user.displayName,
          (idx, progress) => {
            setMediaProgress(prev => {
              const updated = [...prev];
              updated[idx] = progress;
              return updated;
            });
          }
        );
      }
      // Add note (if any) and trigger onSubmit
      await addContribution(
        memory.id,
        user.id,
        user.displayName,
        note,
        [], // media already uploaded
        []
      );
      
      setToast({ message: 'Your contribution has been added!', type: 'success' });
      
      setTimeout(() => {
        onSubmit();
      }, 1000);
    } catch (error) {
      console.error('Error adding contribution:', error);
      setToast({ message: 'Failed to add contribution. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Contribute to Memory</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700">
              {memory.occasion === 'Holiday Meal' ? memory.holiday : memory.occasion}
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(memory.date).toLocaleDateString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Note */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="h-4 w-4" />
                Add a memory or thought
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                placeholder="e.g. Max won 5 straight hands of Taki"
                inputMode="text"
                autoComplete="off"
                spellCheck="true"
              />
            </div>

            {/* Media Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Camera className="h-4 w-4" />
                Add photos or videos
              </label>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              
              {media.length > 0 && (
                <div className="mt-4 space-y-3">
                  {media.map((file, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                        <input
                          type="text"
                          placeholder="Optional caption..."
                          value={mediaCaptions[index]}
                          onChange={(e) => handleMediaCaptionChange(index, e.target.value)}
                          className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                        />
                        {/* Progress bar */}
                        {isSubmitting && (
                          <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                            <div
                              className="h-2 rounded bg-rose-500 transition-all"
                              style={{ width: `${mediaProgress[index] || 0}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || (media.length > 0 && mediaProgress.some(p => p < 100))}
                className="flex-1 bg-rose-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};