import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { auth } from '../firebase/config';
import { Memory, Note, Media } from '../types';

// Memory operations
export const createMemory = async (memoryData: Omit<Memory, 'id' | 'createdAt' | 'notes' | 'media'>) => {
  try {
    console.log('Creating memory with data:', memoryData);
    
    // Validate required fields
    if (!memoryData.date || !memoryData.occasion || !memoryData.attendees || !memoryData.meal || !memoryData.dessert) {
      throw new Error('Missing required fields');
    }
    
    // Validate attendees array
    if (!Array.isArray(memoryData.attendees) || memoryData.attendees.length === 0) {
      throw new Error('Attendees must be a non-empty array');
    }
    
    // Validate createdBy
    if (!memoryData.createdBy) {
      throw new Error('createdBy is required');
    }
    
    // Clean up the data to remove undefined/null/empty values
    const cleanedData = Object.fromEntries(
      Object.entries(memoryData).filter(([_, value]) => {
        // Keep the value if it's not undefined, null, or empty string
        return value !== undefined && value !== null && value !== '';
      })
    );
    
    // Generate eventCode: YYYY-MM-DD or YYYY-MM-DD-N
    // Use the local date as entered by the user, do not convert to UTC
    const localDate = new Date(memoryData.date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const memoriesQuery = query(collection(db, 'memories'), where('date', '>=', dateStr), where('date', '<=', dateStr));
    let eventCode = dateStr;
    const querySnapshot = await getDocs(memoriesQuery);
    if (!querySnapshot.empty) {
      // Check for existing codes to avoid duplicates
      const existingCodes = querySnapshot.docs.map(doc => doc.data().eventCode).filter(Boolean);
      let n = 1;
      let candidate = eventCode;
      while (existingCodes.includes(candidate)) {
        n++;
        candidate = `${eventCode}-${n}`;
      }
      eventCode = candidate;
    }
    
    const finalData = {
      ...cleanedData,
      date: dateStr, // Store as YYYY-MM-DD
      eventCode,
      createdAt: Timestamp.now().toDate().toISOString(),
      notes: [],
      media: []
    };
    
    console.log('Final data to be saved:', finalData);
    
    const docRef = await addDoc(collection(db, 'memories'), finalData);
    
    console.log('Memory created successfully with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating memory:', error);
    console.error('Memory data that failed:', memoryData);
    throw error;
  }
};

export const getMemories = async (): Promise<Memory[]> => {
  try {
    console.log('Fetching memories from Firebase...');
    const memoriesQuery = query(collection(db, 'memories'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(memoriesQuery);
    console.log('Found', querySnapshot.docs.length, 'memory documents');
    
    const memories: Memory[] = [];
    for (const doc of querySnapshot.docs) {
      try {
        const docData = doc.data();
        console.log('Processing memory document:', doc.id, docData);
        
        const memoryData = { 
          id: doc.id, 
          ...docData,
          notes: [], // Initialize empty arrays
          media: []
        } as Memory;
        
        // Get notes for this memory (with error handling)
        try {
          // Simplified query without orderBy to avoid index requirement
          const notesQuery = query(
            collection(db, 'notes'), 
            where('memoryId', '==', doc.id)
          );
          const notesSnapshot = await getDocs(notesQuery);
          const notes = notesSnapshot.docs.map(noteDoc => ({ 
            id: noteDoc.id, 
            ...noteDoc.data() 
          })) as Note[];
          // Sort in memory instead of using Firestore orderBy
          memoryData.notes = notes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          console.log('Found', memoryData.notes.length, 'notes for memory', doc.id);
        } catch (notesError) {
          console.warn('Error fetching notes for memory', doc.id, ':', notesError);
          memoryData.notes = []; // Continue with empty notes array
        }
        
        // Get media for this memory (with error handling)
        try {
          // Simplified query without orderBy to avoid index requirement
          const mediaQuery = query(
            collection(db, 'media'), 
            where('memoryId', '==', doc.id)
          );
          const mediaSnapshot = await getDocs(mediaQuery);
          const media = mediaSnapshot.docs.map(mediaDoc => ({ 
            id: mediaDoc.id, 
            ...mediaDoc.data() 
          })) as Media[];
          // Sort in memory instead of using Firestore orderBy
          memoryData.media = media.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          console.log('Found', memoryData.media.length, 'media items for memory', doc.id);
        } catch (mediaError) {
          console.warn('Error fetching media for memory', doc.id, ':', mediaError);
          memoryData.media = []; // Continue with empty media array
        }
        
        memories.push(memoryData);
        console.log('Successfully processed memory:', memoryData.id, memoryData);
      } catch (docError) {
        console.error('Error processing memory document', doc.id, ':', docError);
        // Continue processing other memories even if one fails
      }
    }
      
    console.log('Final memories array:', memories);
    return memories;
  } catch (error) {
    console.error('Error getting memories:', error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
};

export const getMemory = async (id: string): Promise<Memory | null> => {
  try {
    const docRef = doc(db, 'memories', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const memoryData = { id: docSnap.id, ...docSnap.data() } as Memory;
    
    // Get notes for this memory
    const notesQuery = query(
      collection(db, 'notes'), 
      where('memoryId', '==', id)
    );
    const notesSnapshot = await getDocs(notesQuery);
    const notes = notesSnapshot.docs.map(noteDoc => ({ 
      id: noteDoc.id, 
      ...noteDoc.data() 
    })) as Note[];
    memoryData.notes = notes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Get media for this memory
    const mediaQuery = query(
      collection(db, 'media'), 
      where('memoryId', '==', id)
    );
    const mediaSnapshot = await getDocs(mediaQuery);
    const media = mediaSnapshot.docs.map(mediaDoc => ({ 
      id: mediaDoc.id, 
      ...mediaDoc.data() 
    })) as Media[];
    memoryData.media = media.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return memoryData;
  } catch (error) {
    console.error('Error getting memory:', error);
    throw error;
  }
};

export const getMemoryByEventCode = async (eventCode: string): Promise<Memory | null> => {
  try {
    const memoriesQuery = query(collection(db, 'memories'), where('eventCode', '==', eventCode));
    const querySnapshot = await getDocs(memoriesQuery);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    const memoryData = { id: doc.id, ...doc.data() } as Memory;
    // Get notes for this memory
    const notesQuery = query(
      collection(db, 'notes'),
      where('memoryId', '==', doc.id)
    );
    const notesSnapshot = await getDocs(notesQuery);
    const notes = notesSnapshot.docs.map(noteDoc => ({
      id: noteDoc.id,
      ...noteDoc.data()
    })) as Note[];
    memoryData.notes = notes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    // Get media for this memory
    const mediaQuery = query(
      collection(db, 'media'),
      where('memoryId', '==', doc.id)
    );
    const mediaSnapshot = await getDocs(mediaQuery);
    const media = mediaSnapshot.docs.map(mediaDoc => ({
      id: mediaDoc.id,
      ...mediaDoc.data()
    })) as Media[];
    memoryData.media = media.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return memoryData;
  } catch (error) {
    console.error('Error getting memory by eventCode:', error);
    throw error;
  }
};

// Update memory
export const updateMemory = async (id: string, updateData: Partial<Omit<Memory, 'id' | 'createdAt' | 'notes' | 'media'>>) => {
  try {
    console.log('Updating memory with ID:', id, 'Data:', updateData);
    
    // Clean up the data to remove undefined/null/empty values
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => {
        return value !== undefined && value !== null && value !== '';
      })
    );
    
    console.log('Cleaned update data:', cleanedData);
    
    const docRef = doc(db, 'memories', id);
    await updateDoc(docRef, cleanedData);
    
    console.log('Memory updated successfully');
  } catch (error) {
    console.error('Error updating memory:', error);
    throw error;
  }
};

export const deleteMemory = async (id: string) => {
  try {
    // Delete all notes for this memory
    const notesQuery = query(collection(db, 'notes'), where('memoryId', '==', id));
    const notesSnapshot = await getDocs(notesQuery);
    const noteDeletePromises = notesSnapshot.docs.map(noteDoc => deleteDoc(noteDoc.ref));
    await Promise.all(noteDeletePromises);
    
    // Delete all media files and records for this memory
    const mediaQuery = query(collection(db, 'media'), where('memoryId', '==', id));
    const mediaSnapshot = await getDocs(mediaQuery);
    const mediaDeletePromises = mediaSnapshot.docs.map(async (mediaDoc) => {
      const mediaData = mediaDoc.data() as Media;
      // Delete file from storage
      try {
        const fileRef = ref(storage, mediaData.fileUrl);
        await deleteObject(fileRef);
      } catch (storageError) {
        console.warn('Error deleting file from storage:', storageError);
      }
      // Delete record from Firestore
      return deleteDoc(mediaDoc.ref);
    });
    await Promise.all(mediaDeletePromises);
    
    // Delete the memory itself
    await deleteDoc(doc(db, 'memories', id));
  } catch (error) {
    console.error('Error deleting memory:', error);
    throw error;
  }
};

// Note operations
export const addNote = async (noteData: Omit<Note, 'id' | 'timestamp'>) => {
  try {
    const docRef = await addDoc(collection(db, 'notes'), {
      ...noteData,
      timestamp: Timestamp.now().toDate().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

// Media operations
export const uploadMediaWithProgress = (
  file: File,
  memoryId: string,
  caption: string,
  uploadedBy: string,
  uploadedByName: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting media upload for file:', file.name, 'size:', file.size);
      console.log('Current domain:', window.location.origin);
      console.log('Storage bucket:', storage.app.options.storageBucket);
      console.log('Auth state:', !!auth.currentUser);
      console.log('Auth user email:', auth.currentUser?.email);
      
      // Validate file size (different limits for images vs videos)
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for videos, 10MB for images
      
      if (file.size > maxSize) {
        const maxSizeText = isVideo ? '100MB' : '10MB';
        return reject(new Error(`File size too large. Please choose a ${isVideo ? 'video' : 'image'} smaller than ${maxSizeText}.`));
      }
      
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        return reject(new Error('Invalid file type. Please upload an image or video file.'));
      }
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        return reject(new Error('User must be authenticated to upload files.'));
      }
      
      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = `memories/${memoryId}/media/${fileName}`;
      
      console.log('Uploading to path:', filePath);
      
      // Upload file to Firebase Storage
      const storageRef = ref(storage, filePath);
      
      // Simplified metadata
      const metadata = {
        contentType: file.type
      };
      
      console.log('Attempting upload with metadata:', metadata);
      
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            if (!downloadURL) {
              throw new Error('Failed to get download URL: URL is empty');
            }
            // Save media record to Firestore
            const mediaData = {
              memoryId,
              fileUrl: downloadURL,
              fileType: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
              caption: caption && caption.trim() ? caption.trim() : undefined,
              uploadedBy,
              uploadedByName,
              timestamp: Timestamp.now().toDate().toISOString()
            };
            const cleanMediaData = Object.fromEntries(
              Object.entries(mediaData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
            );
            const docRef = await addDoc(collection(db, 'media'), cleanMediaData);
            resolve(docRef.id);
          } catch (err) {
            reject(err);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

export const uploadMultipleMedia = async (
  files: File[],
  memoryId: string,
  captions: string[],
  uploadedBy: string,
  uploadedByName: string,
  onProgress: (index: number, progress: number) => void
): Promise<string[]> => {
  const uploadPromises = files.map((file, idx) =>
    uploadMediaWithProgress(
      file,
      memoryId,
      captions[idx] || '',
      uploadedBy,
      uploadedByName,
      (progress) => onProgress(idx, progress)
    )
  );
  return Promise.all(uploadPromises);
};

// Contribution operations (combines notes and media)
export const addContribution = async (
  memoryId: string,
  authorId: string,
  authorName: string,
  note?: string,
  mediaFiles?: File[],
  mediaCaptions?: string[]
) => {
  try {
    const promises: Promise<any>[] = [];
    
    // Add note if provided
    if (note && note.trim()) {
      promises.push(addNote({
        memoryId,
        authorId,
        authorName,
        text: note.trim()
      }));
    }
    
    // Upload media files if provided
    if (mediaFiles && mediaFiles.length > 0) {
      mediaFiles.forEach((file, index) => {
        const caption = mediaCaptions?.[index] || '';
        promises.push(uploadMedia(file, memoryId, caption, authorId, authorName));
      });
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error adding contribution:', error);
    throw error;
  }
};