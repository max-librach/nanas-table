import React, { useState, useEffect } from 'react';
import { Plus, User, Mail, Calendar, Edit } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Toast } from '../components/Toast';
import { AddFamilyMemberModal } from '../components/AddFamilyMemberModal';
import { useAuth } from '../contexts/AuthContext';
import { getFamilyMembers, addFamilyMember, updateFamilyMember } from '../services/firebaseService';
import { FAMILY_MEMBERS_LIST } from '../constants';

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthdate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MyFamilyPage: React.FC = () => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load family members from Firebase
  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        setLoading(true);
        const members = await getFamilyMembers();
        
        // If no members in Firebase, initialize with hardcoded data
        if (members.length === 0) {
          console.log('No family members in Firebase, initializing with hardcoded data...');
          const initialMembers: FamilyMember[] = FAMILY_MEMBERS_LIST
            .filter(member => member.name !== 'Other')
            .map((member, index) => ({
              id: `member-${index}`,
              firstName: member.name.split(' ')[0] || member.name,
              lastName: member.name.split(' ').slice(1).join(' ') || '',
              email: '', // We don't have emails in FAMILY_MEMBERS_LIST yet
              birthdate: undefined,
              photoURL: undefined,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));
          
          // Add initial members to Firebase
          for (const member of initialMembers) {
            try {
              await addFamilyMember({
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email,
                birthdate: member.birthdate,
                photoURL: member.photoURL,
                isActive: member.isActive
              });
            } catch (error) {
              console.error('Error adding initial family member:', error);
            }
          }
          
          // Reload from Firebase
          const reloadedMembers = await getFamilyMembers();
          setFamilyMembers(reloadedMembers);
        } else {
          setFamilyMembers(members);
        }
      } catch (error) {
        console.error('Error loading family members:', error);
        setToast({ message: 'Failed to load family members', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadFamilyMembers();
  }, []);

  const formatDate = (dateString: string) => {
    // Parse the date string directly without timezone conversion
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    return `${first}${last}`;
  };

  const getFullName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`.trim();
  };

  const handleAddMember = async (memberData: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Filter out undefined values before sending to Firebase
      const cleanMemberData = Object.fromEntries(
        Object.entries(memberData).filter(([_, value]) => value !== undefined)
      ) as Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>;
      
      const newMemberId = await addFamilyMember(cleanMemberData);
      
      // Reload family members from Firebase
      const updatedMembers = await getFamilyMembers();
      setFamilyMembers(updatedMembers);
      
      setShowAddModal(false);
      setToast({ message: 'Family member added successfully!', type: 'success' });
    } catch (error) {
      console.error('Error adding family member:', error);
      setToast({ message: 'Failed to add family member', type: 'error' });
    }
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
  };

  const handleUpdateMember = async (memberData: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingMember) return;

    try {
      // Filter out undefined values before sending to Firebase
      const cleanMemberData = Object.fromEntries(
        Object.entries(memberData).filter(([_, value]) => value !== undefined)
      ) as Partial<Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>>;
      
      await updateFamilyMember(editingMember.id, cleanMemberData);
      
      // Reload family members from Firebase
      const updatedMembers = await getFamilyMembers();
      setFamilyMembers(updatedMembers);
      
      setEditingMember(null);
      setToast({ message: 'Family member updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating family member:', error);
      setToast({ message: 'Failed to update family member', type: 'error' });
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
            <Card 
              key={member.id} 
              className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleEditMember(member)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                      {member.photoURL ? (
                        <img 
                          src={member.photoURL} 
                          alt={getFullName(member.firstName, member.lastName)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-orange-600">
                          {getInitials(member.firstName, member.lastName)}
                        </span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">
                        {getFullName(member.firstName, member.lastName)}
                      </CardTitle>
                    </div>
                  </div>
                  <Edit className="w-4 h-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {member.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.birthdate ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(member.birthdate)}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>No birthday set</span>
                  </div>
                )}
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

      {/* Edit Family Member Modal */}
      {editingMember && (
        <AddFamilyMemberModal
          onClose={() => setEditingMember(null)}
          onAdd={handleUpdateMember}
          editingMember={editingMember}
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