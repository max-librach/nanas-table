import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Heart, Save, Video } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Toast } from '../components/Toast';
import { FAMILY_MEMBERS_LIST, HOLIDAYS } from '../constants';
import { createMemory } from '../services/firebaseService';
import { uploadMediaWithProgress } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

export const CreateMemoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    occasion: '' as 'Shabbat Dinner' | 'Holiday Meal' | '',
    holiday: '',
    holidayDescription: '',
    meal: '',
    dessert: '',
    celebration: '',
    notes: '',
    media: [] as File[],
    mediaCaptions: [] as string[],
    uploadProgress: [] as number[]
  });

  const [attendees, setAttendees] = useState<{ [key: string]: boolean }>(
    FAMILY_MEMBERS_LIST.reduce(
      (acc, member) => {
        acc[member.name] = member.defaultChecked;
        return acc;
      },
      {} as { [key: string]: boolean }
    )
  );

  const [otherAttendee, setOtherAttendee] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttendeeChange = (name: string, checked: boolean) => {
    setAttendees((prev) => ({ ...prev, [name]: checked }));
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    files.forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for videos, 10MB for images
      
      if (!isVideo && !isImage) {
        errors.push(`${file.name}: Invalid file type. Please upload images or videos only.`);
      } else if (file.size > maxSize) {
        const maxSizeText = isVideo ? '100MB' : '10MB';
        errors.push(`${file.name}: File too large. Maximum size is ${maxSizeText}.`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (errors.length > 0) {
      setToast({ message: errors.join(' '), type: 'error' });
    }
    
    setFormData(prev => ({
      ...prev,
      media: [...prev.media, ...validFiles],
      mediaCaptions: [...prev.mediaCaptions, ...validFiles.map(() => '')],
      uploadProgress: [...prev.uploadProgress, ...validFiles.map(() => 0)]
    }));
  };

  const removeMedia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
      mediaCaptions: prev.mediaCaptions.filter((_, i) => i !== index),
      uploadProgress: prev.uploadProgress.filter((_, i) => i !== index)
    }));
  };

  const getSelectedAttendees = () => {
    const selected = Object.entries(attendees)
      .filter(([_, checked]) => checked)
      .map(([name, _]) => name)
      .filter((name) => name !== 'Other');

    if (attendees['Other'] && otherAttendee.trim()) {
      selected.push(otherAttendee.trim());
    }

    return selected;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setToast({ message: 'You must be signed in to create a memory', type: 'error' });
      return;
    }

    // Validation
    const selectedAttendees = getSelectedAttendees();
    if (!formData.date || !formData.occasion || !selectedAttendees.length || !formData.meal) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    if (formData.occasion === 'Holiday Meal' && !formData.holiday) {
      setToast({ message: 'Please select a holiday', type: 'error' });
      return;
    }

    if (formData.occasion === 'Holiday Meal' && formData.holiday === 'Other' && !formData.holidayDescription) {
      setToast({ message: 'Please describe the holiday', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Form data before submission:', formData);
      console.log('Selected attendees:', selectedAttendees);
      console.log('User:', user);
      
      // Separate media files from memory data
      const { media: mediaFiles, mediaCaptions, ...memoryDataWithoutMedia } = formData;
      
      // Clean up the memory data to remove any undefined/null values, but always keep createdByName
      const memoryData = {
        ...memoryDataWithoutMedia,
        attendees: selectedAttendees,
        otherAttendees: attendees['Other'] && otherAttendee.trim() ? otherAttendee.trim() : undefined,
        createdBy: user.id,
        createdByName: user.displayName || ''
      };
      
      // Remove undefined/null/empty values except for createdByName
      const cleanMemoryData = Object.fromEntries(
        Object.entries(memoryData).filter(([key, value]) =>
          key === 'createdByName' || (value !== undefined && value !== null && value !== '')
        )
      );
      
      console.log('Final memory data:', cleanMemoryData);
      
      const memoryId = await createMemory(cleanMemoryData);
      console.log('Memory created with ID:', memoryId);
      
      // Upload media files separately if any
      if (mediaFiles && mediaFiles.length > 0) {
        console.log('Uploading', mediaFiles.length, 'media files...');
        
        // Update progress for each file
        const updateProgress = (index: number, progress: number) => {
          setFormData(prev => ({
            ...prev,
            uploadProgress: prev.uploadProgress.map((p, i) => i === index ? progress : p)
          }));
        };
        
        try {
          // Upload files one by one instead of in parallel to avoid overwhelming the server
          for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i];
            const caption = mediaCaptions?.[i] || '';
            const isVideo = file.type.startsWith('video/');
            
            console.log(`Uploading file ${i + 1}/${mediaFiles.length}:`, file.name);
            updateProgress(i, 10); // Start progress
            
            if (isVideo) {
              setToast({ 
                message: `Uploading video ${i + 1}/${mediaFiles.length}... This may take a while.`, 
                type: 'success' 
              });
            }
            
            updateProgress(i, 50); // Mid progress
            await uploadMediaWithProgress(file, memoryId, caption, user.id, user.displayName, () => {});
            updateProgress(i, 100); // Complete
          }
          
          console.log('All media files uploaded successfully');
          const hasVideos = mediaFiles.some(f => f.type.startsWith('video/'));
          const hasPhotos = mediaFiles.some(f => f.type.startsWith('image/'));
          
          let message = 'Memory saved successfully!';
          if (hasVideos && hasPhotos) {
            message = 'Memory with photos and videos saved successfully!';
          } else if (hasVideos) {
            message = 'Memory with videos saved successfully!';
          } else if (hasPhotos) {
            message = 'Memory with photos saved successfully!';
          }
          
          setToast({ message, type: 'success' });
        } catch (uploadError) {
          console.error('Error uploading media files:', uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown upload error';
          setToast({ 
            message: `Memory saved, but media upload failed: ${errorMessage}. You can add files later.`, 
            type: 'error' 
          });
        }
      } else {
        setToast({ message: 'Memory saved successfully!', type: 'success' });
      }
      
      // Navigate to timeline after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error creating memory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setToast({ 
        message: `Failed to create memory: ${errorMessage}`, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-800"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
              <img 
                src="/nanas-table-logo.jpg" 
                alt="Nana's Table" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Create New Memory</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">Add a New Memory</CardTitle>
            <CardDescription className="text-gray-600">
              What did we eat, who was there, what made it special?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Required Fields */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Essential Details</h3>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-700">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occasion" className="text-gray-700">
                    Occasion <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.occasion} onValueChange={(value) => handleInputChange('occasion', value)}>
                    <SelectTrigger className="border-gray-200 focus:border-orange-300 focus:ring-orange-200">
                      <SelectValue placeholder="Select an occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Shabbat Dinner">Shabbat Dinner</SelectItem>
                      <SelectItem value="Holiday Meal">Holiday Meal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.occasion === 'Holiday Meal' && (
                  <div className="space-y-2">
                    <Label htmlFor="holiday" className="text-gray-700">
                      Holiday <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.holiday} onValueChange={(value) => handleInputChange('holiday', value)}>
                      <SelectTrigger className="border-gray-200 focus:border-orange-300 focus:ring-orange-200">
                        <SelectValue placeholder="Select a holiday" />
                      </SelectTrigger>
                      <SelectContent>
                        {HOLIDAYS.map((holiday) => (
                          <SelectItem key={holiday} value={holiday}>
                            {holiday}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.occasion === 'Holiday Meal' && formData.holiday === 'Other' && (
                  <div className="space-y-2">
                    <Label htmlFor="holidayDescription" className="text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="holidayDescription"
                      placeholder="Describe the holiday or occasion"
                      value={formData.holidayDescription}
                      onChange={(e) => handleInputChange('holidayDescription', e.target.value)}
                      className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                      required
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-gray-700">
                    Who was there? <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {FAMILY_MEMBERS_LIST.filter(member => !['Shoko', 'Lucy', 'Other'].includes(member.name)).map((member) => (
                      <div key={member.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={member.name}
                          checked={attendees[member.name] || false}
                          onCheckedChange={(checked) => handleAttendeeChange(member.name, checked as boolean)}
                        />
                        <Label htmlFor={member.name} className="text-sm text-gray-700 cursor-pointer">
                          {member.name}
                        </Label>
                      </div>
                    ))}
                    {/* Shoko, Lucy, and Other at the end */}
                    {['Shoko', 'Lucy', 'Other'].map((memberName) => {
                      const member = FAMILY_MEMBERS_LIST.find(m => m.name === memberName);
                      if (!member) return null;
                      return (
                        <div key={member.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={member.name}
                            checked={attendees[member.name] || false}
                            onCheckedChange={(checked) => handleAttendeeChange(member.name, checked as boolean)}
                          />
                          <Label htmlFor={member.name} className="text-sm text-gray-700 cursor-pointer">
                            {member.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  {attendees['Other'] && (
                    <div className="mt-3">
                      <Input
                        placeholder="Who else was there?"
                        value={otherAttendee}
                        onChange={(e) => setOtherAttendee(e.target.value)}
                        className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 text-lg font-semibold">What we ate</Label>
                  <div className="space-y-2 pl-2">
                    <Label htmlFor="meal" className="text-gray-700">
                      Meal <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="meal"
                      placeholder="e.g., Challah, roasted chicken, roasted vegetables, kugel"
                      value={formData.meal}
                      onChange={(e) => handleInputChange('meal', e.target.value)}
                      className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 min-h-[60px]"
                      required
                    />
                    <Label htmlFor="dessert" className="font-semibold">Dessert</Label>
                    <Textarea
                      id="dessert"
                      value={formData.dessert}
                      onChange={e => handleInputChange('dessert', e.target.value)}
                      placeholder="e.g. brownies, ice cream, fruit salad"
                    />
                  </div>
                </div>
              </div>

              {/* Extra Special Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Extra Special Details</h3>

                <div className="space-y-2">
                  <Label htmlFor="celebration" className="text-gray-700">
                    Anything special we celebrated?
                  </Label>
                  <Input
                    id="celebration"
                    placeholder="e.g. birthdays, new jobs, gymnastics trophies"
                    value={formData.celebration}
                    onChange={(e) => handleInputChange('celebration', e.target.value)}
                    className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-gray-700">
                    Miscellaneous notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any funny moments, conversations, or memories we want to remember..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 min-h-[100px]"
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Capture the Moments</h3>

                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-28 border-dashed border-2 border-orange-200 text-orange-600 hover:bg-orange-50 flex flex-col items-center justify-center space-y-2 bg-transparent"
                  >
                    <div className="flex items-center space-x-2">
                      <Camera className="w-6 h-6" />
                      <Video className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-medium">Add photos or videos</span>
                      <p className="text-xs text-gray-500 mt-1">
                        Photos: up to 10MB • Videos: up to 100MB
                      </p>
                    </div>
                  </Button>
                </div>

                {formData.media.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm text-gray-600">
                      <p>{formData.media.length} file(s) selected</p>
                      {formData.media.some(f => f.type.startsWith('video/')) && (
                        <p className="text-amber-600 text-xs mt-1 bg-amber-50 p-2 rounded">
                          ⚠️ Videos may take several minutes to upload depending on size and connection
                        </p>
                      )}
                    </div>
                    {formData.media.map((file, index) => (
                      <div key={index} className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {file.type.startsWith('video/') ? '📹' : '📷'}
                            <span className="font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(1)}MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            ✕
                          </button>
                        </div>
                        
                        {/* Upload Progress Bar (shown during submission) */}
                        {isSubmitting && formData.uploadProgress[index] > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Uploading...</span>
                              <span>{formData.uploadProgress[index]}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${formData.uploadProgress[index]}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {formData.media.length > 0 ? 'Saving & Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save This Memory
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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