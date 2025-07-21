import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { getMemoryByEventCode, updateMemory } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { Memory } from '../types';

export const EditMemoryPage: React.FC = () => {
  const { eventCode } = useParams<{ eventCode: string }>();
  const id = eventCode;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memory, setMemory] = useState<Memory | null>(null);
  
  const [formData, setFormData] = useState({
    date: '',
    occasion: '' as 'Shabbat Dinner' | 'Holiday Meal' | '',
    holiday: '',
    holidayDescription: '',
    meal: '',
    dessert: '',
    celebration: '',
    notes: ''
  });

  const [attendees, setAttendees] = useState<{ [key: string]: boolean }>(
    FAMILY_MEMBERS_LIST.reduce(
      (acc, member) => {
        acc[member.name] = false;
        return acc;
      },
      {} as { [key: string]: boolean }
    )
  );

  const [otherAttendee, setOtherAttendee] = useState('');

  // Load memory data
  useEffect(() => {
    if (id) {
      loadMemory();
    }
  }, [id]);

  const loadMemory = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const memoryData = await getMemoryByEventCode(id);
      
      if (!memoryData) {
        setToast({ message: 'Memory not found', type: 'error' });
        setLoading(false);
        return;
      }

      setMemory(memoryData);
      
      // Populate form with existing data
      setFormData({
        date: memoryData.date,
        occasion: memoryData.occasion,
        holiday: memoryData.holiday || '',
        holidayDescription: memoryData.holidayDescription || '',
        meal: memoryData.meal || memoryData.food || '',
        dessert: memoryData.dessert || '',
        celebration: memoryData.celebration || '',
        notes: memoryData.notes.map(note => note.text).join('\n\n') || ''
      });

      // Set attendees
      const attendeeState: { [key: string]: boolean } = {};
      FAMILY_MEMBERS_LIST.forEach(member => {
        attendeeState[member.name] = memoryData.attendees.includes(member.name);
      });
      
      // Handle "Other" attendees
      const knownAttendees = FAMILY_MEMBERS_LIST.map(m => m.name).filter(name => name !== 'Other');
      const otherAttendees = memoryData.attendees.filter(name => !knownAttendees.includes(name));
      
      if (otherAttendees.length > 0) {
        attendeeState['Other'] = true;
        setOtherAttendee(otherAttendees.join(', '));
      }
      
      setAttendees(attendeeState);
    } catch (error) {
      console.error('Error loading memory:', error);
      setToast({ message: 'Failed to load memory', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttendeeChange = (name: string, checked: boolean) => {
    setAttendees((prev) => ({ ...prev, [name]: checked }));
  };

  const getSelectedAttendees = () => {
    const selected = Object.entries(attendees)
      .filter(([_, checked]) => checked)
      .map(([name, _]) => name)
      .filter((name) => name !== 'Other');

    if (attendees['Other'] && otherAttendee.trim()) {
      selected.push(...otherAttendee.split(',').map(name => name.trim()).filter(name => name));
    }

    return selected;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id || !memory) {
      setToast({ message: 'Unable to update memory', type: 'error' });
      return;
    }

    // Validation
    const selectedAttendees = getSelectedAttendees();
    if (!formData.date || !formData.occasion || !selectedAttendees.length || !formData.meal || !formData.dessert) {
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
      const updateData = {
        ...formData,
        attendees: selectedAttendees,
        otherAttendees: attendees['Other'] && otherAttendee.trim() ? otherAttendee.trim() : undefined
      };
      
      // Remove undefined values
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );
      
      await updateMemory(id, cleanUpdateData);
      
      setToast({ message: 'Memory updated successfully!', type: 'success' });
      
      // Navigate back to memory details after a short delay
      setTimeout(() => {
        navigate(`/memory/${id}`);
      }, 1000);
    } catch (error) {
      console.error('Error updating memory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setToast({ 
        message: `Failed to update memory: ${errorMessage}`, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-400"></div>
        </div>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Memory not found</h2>
            <Button 
              className="bg-gradient-to-r from-orange-400 to-pink-400 text-white"
              onClick={() => navigate('/')}
            >
              Back to Timeline
            </Button>
          </CardContent>
        </Card>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    );
  }

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
              onClick={() => navigate(`/memory/${id}`)}
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
              <h1 className="text-lg font-bold text-gray-800">Edit Memory</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">Edit Memory Details</CardTitle>
            <CardDescription className="text-gray-600">
              Update the details of this family memory
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
                    <Label htmlFor="dessert" className="text-gray-700">
                      Dessert <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="dessert"
                      placeholder="e.g., Chocolate cake, fruit salad, cookies"
                      value={formData.dessert}
                      onChange={(e) => handleInputChange('dessert', e.target.value)}
                      className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 min-h-[40px]"
                      required
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
                  <p className="text-xs text-gray-500">
                    Note: Existing memory notes and contributions will remain unchanged. This field is for general notes about the memory.
                  </p>
                </div>
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Memory
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