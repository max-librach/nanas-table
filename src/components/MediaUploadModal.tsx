import React, { useState } from 'react';
import { X, Upload, Camera, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Memory } from '../types';
import { uploadMultipleMedia } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory;
  onMediaUploaded?: () => void;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  memory,
  onMediaUploaded
}) => {
  const { user } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaCaptions, setMediaCaptions] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    setMediaFiles(prev => [...prev, ...validFiles]);
    setMediaCaptions(prev => [...prev, ...validFiles.map(() => '')]);
    setUploadProgress(prev => [...prev, ...validFiles.map(() => 0)]);
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaCaptions(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
  };

  const handleCaptionChange = (index: number, caption: string) => {
    setMediaCaptions(prev => {
      const newCaptions = [...prev];
      newCaptions[index] = caption;
      return newCaptions;
    });
  };

  const handleUpload = async () => {
    if (!user || mediaFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      await uploadMultipleMedia(
        mediaFiles,
        memory.id,
        mediaCaptions,
        user.id,
        user.displayName,
        (index, progress) => {
          setUploadProgress(prev => {
            const newProgress = [...prev];
            newProgress[index] = progress;
            return newProgress;
          });
        }
      );

      // Reset form
      setMediaFiles([]);
      setMediaCaptions([]);
      setUploadProgress([]);
      
      onMediaUploaded?.();
      onClose();
    } catch (error) {
      console.error('Error uploading media:', error);
      setError('Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const totalProgress = uploadProgress.length > 0 
    ? uploadProgress.reduce((sum, progress) => sum + progress, 0) / uploadProgress.length 
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Add Media</CardTitle>
              <CardDescription>
                Upload photos and videos to this memory
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="media-upload" className="text-sm font-medium">
              Select Photos & Videos
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-300 transition-colors">
              <input
                id="media-upload"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="media-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Click to select photos and videos
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports JPG, PNG, MP4, MOV
                </p>
              </label>
            </div>
          </div>

          {/* Selected Files */}
          {mediaFiles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Selected Files</Label>
              {mediaFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    {file.type.startsWith('image/') ? (
                      <Camera className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Video className="w-4 h-4 text-purple-600" />
                    )}
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Captions */}
          {mediaFiles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Add Captions (Optional)</Label>
              {mediaFiles.map((file, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs text-gray-600">
                    Caption for {file.name}
                  </Label>
                  <Input
                    value={mediaCaptions[index]}
                    onChange={(e) => handleCaptionChange(index, e.target.value)}
                    placeholder="Describe this photo/video..."
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Uploading...</Label>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                {Math.round(totalProgress)}% complete
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || mediaFiles.length === 0}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {isUploading ? 'Uploading...' : 'Upload Media'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 