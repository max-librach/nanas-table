export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface Memory {
  id: string;
  date: string;
  occasion: 'Shabbat Dinner' | 'Holiday Meal';
  holiday?: string;
  attendees: string[];
  otherAttendees?: string;
  meal: string;
  dessert: string;
  celebration?: string;
  createdBy: string;
  createdAt: string;
  notes: Note[];
  media: Media[];
  coverPhotoId?: string;
  eventCode?: string;
  recipeIds?: string[];
}

export interface Note {
  id: string;
  memoryId: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: string;
}

export interface Media {
  id: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  caption?: string;
  uploadedBy: string;
  uploadedByName: string;
  timestamp: string;
  memoryId?: string;
  recipeIds?: string[];
  type?: 'event' | 'recipe';
}

export interface ContributionForm {
  note?: string;
  media?: File[];
  mediaCaptions?: string[];
}

export interface Recipe {
  id: string;
  title: string;
  instructions: string;
  tags: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  photoUrls: string[];
}