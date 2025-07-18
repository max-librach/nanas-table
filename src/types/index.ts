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
  memoryId: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  caption?: string;
  uploadedBy: string;
  uploadedByName: string;
  timestamp: string;
}

export interface ContributionForm {
  note?: string;
  media?: File[];
  mediaCaptions?: string[];
}