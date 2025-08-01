import React, { useState, useEffect } from 'react';
import { Plus, User, Mail, Calendar, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Toast } from '../components/Toast';
import { AddFamilyMemberModal } from '../components/AddFamilyMemberModal';
import { useAuth } from '../contexts/AuthContext';
import { FAMILY_MEMBERS_LIST } from '../constants';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  birthdate?: string;
  photoURL?: string;
  role?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MyFamilyPage: React.FC = () => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // For now, we'll use the hardcoded data from constants
  useEffect(() => {
    // Convert FAMILY_MEMBERS_LIST to FamilyMember format
    const members: FamilyMember[] = FAMILY_MEMBERS_LIST.map((member, index) => ({
      id: `member-${index}`,
      name: member.name,
      email: '', // We don't have emails in FAMILY_MEMBERS_LIST yet
      birthdate: undefined,
      photoURL: undefined,
      role: undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    setFamilyMembers(members);
    setLoading(false);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAddMember = async (memberData: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // For now, just add to local state
      const newMember: FamilyMember = {
        ...memberData,
        id: `member-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setFamilyMembers(prev => [...prev, newMember]);
      setShowAddModal(false);
      setToast({ message: 'Family member added successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to add family member', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading family members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Family</h1>
              <p className="text-gray-600 mt-1">Manage your family members and their information</p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyMembers.map((member) => (
            <Card key={member.id} className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                      {member.photoURL ? (
                        <img 
                          src={member.photoURL} 
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-orange-600">
                          {getInitials(member.name)}
                        </span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">{member.name}</CardTitle>
                      {member.role && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Crown className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-gray-500">{member.role}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={member.isActive ? "default" : "secondary"}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {member.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.birthdate && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(member.birthdate)}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>Member since {formatDate(member.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {familyMembers.length === 0 && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                <User className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Family Members Yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your first family member</p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Family Member Modal */}
      {showAddModal && (
        <AddFamilyMemberModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddMember}
        />
      )}

      {/* Toast */}
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