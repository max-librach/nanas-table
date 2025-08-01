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
  Timestamp,
  arrayUnion,
  arrayRemove
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
import { Memory, Note, Media, Recipe, FamilyMember } from '../types';

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
    
    // Use the date string from the form directly (no Date conversion)
    const dateStr = memoryData.date;
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
      date: dateStr, // Store as YYYY-MM-DD from the form
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
    
    if (querySnapshot.empty) {
      return [];
    }

    // Get all memory IDs for batch queries
    const memoryIds = querySnapshot.docs.map(doc => doc.id);
    
    // Batch query for all notes
    const notesQuery = query(
      collection(db, 'notes'),
      where('memoryId', 'in', memoryIds)
    );
    
        // Batch query for all media
    const mediaQuery = query(
      collection(db, 'media'),
      where('memoryId', 'in', memoryIds)
    );
    
    // Execute both queries in parallel
    const [notesSnapshot, mediaSnapshot] = await Promise.all([
      getDocs(notesQuery),
      getDocs(mediaQuery)
    ]);
    
    // Create lookup maps for efficient data association
    const notesByMemoryId = new Map<string, Note[]>();
    const mediaByMemoryId = new Map<string, Media[]>();
    
    // Process notes
    notesSnapshot.docs.forEach(noteDoc => {
      const noteData = { id: noteDoc.id, ...noteDoc.data() } as Note;
      const memoryId = noteData.memoryId;
      if (memoryId && !notesByMemoryId.has(memoryId)) {
        notesByMemoryId.set(memoryId, []);
      }
      if (memoryId) {
        notesByMemoryId.get(memoryId)!.push(noteData);
      }
    });
    
    // Process media
    mediaSnapshot.docs.forEach(mediaDoc => {
      const mediaData = { id: mediaDoc.id, ...mediaDoc.data() } as Media;
      const memoryId = mediaData.memoryId;
      if (memoryId && !mediaByMemoryId.has(memoryId)) {
        mediaByMemoryId.set(memoryId, []);
      }
      if (memoryId) {
        mediaByMemoryId.get(memoryId)!.push(mediaData);
      }
    });
    
    // Build memories with associated data
    const memories: Memory[] = [];
    for (const doc of querySnapshot.docs) {
      try {
        const docData = doc.data();
        console.log('Processing memory document:', doc.id, docData);
        
        const memoryData = { 
          id: doc.id, 
          ...docData,
          notes: notesByMemoryId.get(doc.id) || [],
          media: mediaByMemoryId.get(doc.id) || []
        } as Memory;
        
        // Sort notes and media by timestamp
        memoryData.notes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        memoryData.media.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        console.log('Found', memoryData.notes.length, 'notes and', memoryData.media.length, 'media items for memory', doc.id);
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

    // Delete all memory comments for this memory
    const memoryCommentsQuery = query(collection(db, 'memoryComments'), where('memoryId', '==', id));
    const memoryCommentsSnapshot = await getDocs(memoryCommentsQuery);
    const memoryCommentDeletePromises = memoryCommentsSnapshot.docs.map(commentDoc => deleteDoc(commentDoc.ref));
    await Promise.all(memoryCommentDeletePromises);
    
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
  onProgress: (progress: number) => void,
  recipeIds?: string[]
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
              timestamp: Timestamp.now().toDate().toISOString(),
              ...(recipeIds && recipeIds.length > 0 ? { recipeIds } : {})
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
  onProgress: (index: number, progress: number) => void,
  recipeIdsList?: string[][]
): Promise<string[]> => {
  const results: string[] = [];
  const errors: Error[] = [];
  
  // Upload files sequentially to avoid rate limiting and better error handling
  for (let i = 0; i < files.length; i++) {
    try {
      const fileId = await uploadMediaWithProgress(
        files[i],
        memoryId,
        captions[i] || '',
        uploadedBy,
        uploadedByName,
        (progress) => onProgress(i, progress),
        recipeIdsList ? recipeIdsList[i] : undefined
      );
      results.push(fileId);
      
      // Add a small delay between uploads to avoid overwhelming Firebase
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error uploading file ${files[i].name}:`, error);
      errors.push(error as Error);
      // Continue with other files instead of failing completely
    }
  }
  
  // If any files failed to upload, throw an error with details
  if (errors.length > 0) {
    const errorMessage = `Failed to upload ${errors.length} out of ${files.length} files: ${errors.map(e => e.message).join(', ')}`;
    throw new Error(errorMessage);
  }
  
  return results;
};

export const deleteMedia = async (mediaId: string, fileUrl: string) => {
  try {
    // Delete the media record from Firestore
    const mediaRef = doc(db, 'media', mediaId);
    await deleteDoc(mediaRef);

    // Delete the file from Firebase Storage
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);

    console.log('Media deleted successfully:', mediaId);
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
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
        promises.push(uploadMediaWithProgress(file, memoryId, caption, authorId, authorName, () => {}, []));
      });
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error adding contribution:', error);
    throw error;
  }
};

// === Recipe CRUD ===
export const createRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt'>) => {
  try {
    console.log('Attempting to create recipe:', recipeData);
    const docRef = await addDoc(collection(db, 'recipes'), {
      ...recipeData,
      createdAt: Timestamp.now().toDate().toISOString()
    });
    console.log('Recipe created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw error;
  }
};

export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'recipes'));
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Recipe));
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
};

export const updateRecipe = async (id: string, updateData: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => {
  try {
    const docRef = doc(db, 'recipes', id);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
};

export const deleteRecipe = async (id: string) => {
  try {
    const docRef = doc(db, 'recipes', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
};

// === Recipe Tagging for Media ===
export const tagPhotoWithRecipe = async (mediaId: string, recipeId: string) => {
  try {
    const mediaRef = doc(db, 'media', mediaId);
    await updateDoc(mediaRef, { recipeIds: arrayUnion(recipeId) });
  } catch (error) {
    console.error('Error tagging photo with recipe:', error);
    throw error;
  }
};

export const untagPhotoFromRecipe = async (mediaId: string, recipeId: string) => {
  try {
    const mediaRef = doc(db, 'media', mediaId);
    await updateDoc(mediaRef, { recipeIds: arrayRemove(recipeId) });
  } catch (error) {
    console.error('Error untagging photo from recipe:', error);
    throw error;
  }
};

// === Recipe Tagging for Memories ===
export const tagMemoryWithRecipe = async (memoryId: string, recipeId: string) => {
  try {
    const memoryRef = doc(db, 'memories', memoryId);
    await updateDoc(memoryRef, { recipeIds: arrayUnion(recipeId) });
  } catch (error) {
    console.error('Error tagging memory with recipe:', error);
    throw error;
  }
};

export const untagMemoryFromRecipe = async (memoryId: string, recipeId: string) => {
  try {
    const memoryRef = doc(db, 'memories', memoryId);
    await updateDoc(memoryRef, { recipeIds: arrayRemove(recipeId) });
  } catch (error) {
    console.error('Error untagging memory from recipe:', error);
    throw error;
  }
};

export const getAllRecipes = async (): Promise<Recipe[]> => {
  try {
    const recipesQuery = query(collection(db, 'recipes'), orderBy('title'));
    const querySnapshot = await getDocs(recipesQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
};

// Fetch a single recipe by ID
export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  try {
    const docRef = doc(db, 'recipes', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Recipe;
  } catch (error) {
    console.error('Error fetching recipe by ID:', error);
    return null;
  }
};

// Fetch all media tagged with a given recipeId
export const getMediaByRecipeId = async (recipeId: string): Promise<Media[]> => {
  try {
    const mediaQuery = query(collection(db, 'media'), where('recipeIds', 'array-contains', recipeId));
    const querySnapshot = await getDocs(mediaQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Media));
  } catch (error) {
    console.error('Error fetching media by recipeId:', error);
    return [];
  }
};

// Fetch a single recipe by slug
export const getRecipeBySlug = async (slug: string): Promise<Recipe | null> => {
  try {
    const recipesQuery = query(collection(db, 'recipes'), where('slug', '==', slug));
    const querySnapshot = await getDocs(recipesQuery);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Recipe;
  } catch (error) {
    console.error('Error fetching recipe by slug:', error);
    return null;
  }
};

// Fetch all memories where a recipe is used (mealRecipeIds, dessertRecipeIds, or recipeIds)
export const getMemoriesByRecipeId = async (recipeId: string): Promise<Memory[]> => {
  try {
    // Query for memories where recipeId is in mealRecipeIds, dessertRecipeIds, or recipeIds
    const memoriesQuery1 = query(collection(db, 'memories'), where('mealRecipeIds', 'array-contains', recipeId));
    const memoriesQuery2 = query(collection(db, 'memories'), where('dessertRecipeIds', 'array-contains', recipeId));
    const memoriesQuery3 = query(collection(db, 'memories'), where('recipeIds', 'array-contains', recipeId));
    const [snap1, snap2, snap3] = await Promise.all([
      getDocs(memoriesQuery1),
      getDocs(memoriesQuery2),
      getDocs(memoriesQuery3)
    ]);
    const allDocs = [...snap1.docs, ...snap2.docs, ...snap3.docs];
    // Remove duplicates by memory ID
    const uniqueMemories: { [id: string]: Memory } = {};
    for (const doc of allDocs) {
      uniqueMemories[doc.id] = { id: doc.id, ...doc.data() } as Memory;
    }
    return Object.values(uniqueMemories);
  } catch (error) {
    console.error('Error fetching memories by recipeId:', error);
    return [];
  }
};

// === Recipe Comments ===
export const addRecipeComment = async (recipeId: string, authorId: string, authorName: string, text: string) => {
  try {
    const docRef = await addDoc(collection(db, 'recipeComments'), {
      recipeId,
      authorId,
      authorName,
      text,
      timestamp: Timestamp.now().toDate().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding recipe comment:', error);
    throw error;
  }
};

export const getRecipeComments = async (recipeId: string) => {
  try {
    const commentsQuery = query(collection(db, 'recipeComments'), where('recipeId', '==', recipeId), orderBy('timestamp'));
    const querySnapshot = await getDocs(commentsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching recipe comments:', error);
    return [];
  }
};

// === Memory Comments ===
export const addMemoryComment = async (memoryId: string, authorId: string, authorName: string, text: string) => {
  try {
    const docRef = await addDoc(collection(db, 'memoryComments'), {
      memoryId,
      authorId,
      authorName,
      text,
      timestamp: Timestamp.now().toDate().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding memory comment:', error);
    throw error;
  }
};

export const getMemoryComments = async (memoryId: string) => {
  try {
    const commentsQuery = query(collection(db, 'memoryComments'), where('memoryId', '==', memoryId));
    const querySnapshot = await getDocs(commentsQuery);
    const comments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    // Sort in memory instead of using Firestore orderBy to avoid index requirement
    return comments.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.error('Error fetching memory comments:', error);
    return [];
  }
};

// === Data Migration: Move old contribute modal comments to new comments system ===
export const migrateOldCommentsToNewSystem = async () => {
  try {
    console.log('Starting migration of old contribute modal comments...');
    
    // Get all memories
    const memories = await getMemories();
    let migratedCount = 0;
    
    for (const memory of memories) {
      // Check if memory has notes (old contribute modal comments)
      if (memory.notes && memory.notes.length > 0) {
        console.log(`Migrating ${memory.notes.length} comments for memory ${memory.id}`);
        
        for (const note of memory.notes) {
          try {
            // Add to new comments system
            await addMemoryComment(
              memory.id,
              note.authorId || 'unknown',
              note.authorName || 'Unknown User',
              note.text
            );
            migratedCount++;
          } catch (error) {
            console.error(`Failed to migrate comment ${note.id} for memory ${memory.id}:`, error);
          }
        }
      }
    }
    
    console.log(`Migration complete. Migrated ${migratedCount} comments.`);
    return migratedCount;
  } catch (error) {
    console.error('Error during comment migration:', error);
    throw error;
  }
};

// === Run Migration (call this once to migrate data) ===
export const runMigration = async () => {
  try {
    console.log('Running data migration...');
    const migratedCount = await migrateOldCommentsToNewSystem();
    console.log(`Migration completed successfully. Migrated ${migratedCount} comments.`);
    return migratedCount;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Family Members
export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  try {
    console.log('Fetching family members from Firebase...');
    const familyMembersRef = collection(db, 'familyMembers');
    // Simplified query to avoid index requirements - we'll filter and sort in JavaScript
    const q = query(familyMembersRef);
    const querySnapshot = await getDocs(q);
    
    console.log('Found', querySnapshot.docs.length, 'family member documents');
    
    const familyMembers = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((member: any) => member.isActive) // Filter active members
      .sort((a: any, b: any) => {
        // Sort by lastName first, then firstName
        const lastNameCompare = a.lastName.localeCompare(b.lastName);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName);
      }) as FamilyMember[]; // Sort by name
    
    console.log('Family members loaded:', familyMembers);
    return familyMembers;
  } catch (error) {
    console.error('Error fetching family members:', error);
    
    // If the collection doesn't exist yet, return empty array instead of throwing
    if (error instanceof Error && error.message.includes('collection')) {
      console.log('Family members collection does not exist yet, returning empty array');
      return [];
    }
    
    throw error;
  }
};

export const addFamilyMember = async (familyMember: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const familyMembersRef = collection(db, 'familyMembers');
    const now = new Date().toISOString();
    const docRef = await addDoc(familyMembersRef, {
      ...familyMember,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding family member:', error);
    throw error;
  }
};

export const updateFamilyMember = async (id: string, updates: Partial<FamilyMember>): Promise<void> => {
  try {
    const familyMemberRef = doc(db, 'familyMembers', id);
    await updateDoc(familyMemberRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating family member:', error);
    throw error;
  }
};

export const deleteFamilyMember = async (id: string): Promise<void> => {
  try {
    const familyMemberRef = doc(db, 'familyMembers', id);
    await updateDoc(familyMemberRef, {
      isActive: false,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting family member:', error);
    throw error;
  }
};