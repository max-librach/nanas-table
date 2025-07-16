import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Memory } from '../types';
import { Toast } from './Toast';
import { deleteMemory } from '../services/firebaseService';

interface DeleteMemoryModalProps {
  memory: Memory;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteMemoryModal: React.FC<DeleteMemoryModalProps> = ({ memory, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      await deleteMemory(memory.id);
      
      setToast({ message: 'Memory deleted successfully', type: 'success' });
      
      setTimeout(() => {
        onConfirm();
      }, 1000);
    } catch (error) {
      setToast({ message: 'Failed to delete memory. Please try again.', type: 'error' });
      setIsDeleting(false);
    }
  };

  const displayTitle = memory.occasion === 'Holiday Meal' ? memory.holiday : memory.occasion;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Delete Memory</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isDeleting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this memory? This action cannot be undone.
            </p>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700">{displayTitle}</h3>
              <p className="text-sm text-gray-600">
                {new Date(memory.date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {memory.attendees.join(', ')}
              </p>
            </div>

            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">This will permanently delete:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>The memory and all its details</li>
                    <li>All photos and videos ({memory.media.length} files)</li>
                    <li>All notes and contributions ({memory.notes.length} notes)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Memory
                </>
              )}
            </button>
          </div>
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