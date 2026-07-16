import { Course } from '@/types';

const DB_NAME = 'synapse_db';
const STORE_NAME = 'course_history';
const DB_VERSION = 1;

/**
 * Initializes and opens the IndexedDB database.
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is not available on server-side'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Retrieves all courses from IndexedDB, sorted by createdAt descending.
 */
export async function getCoursesFromIndexedDB(): Promise<Course[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const courses = request.result as Course[];
        // Sort by createdAt descending (newest first)
        courses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(courses);
      };
    });
  } catch (err) {
    console.error('IndexedDB getCourses failed:', err);
    return [];
  }
}

/**
 * Retrieves a single course from IndexedDB by ID.
 */
export async function getCourseFromIndexedDB(id: string): Promise<Course | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (err) {
    console.error('IndexedDB getCourse failed:', err);
    return null;
  }
}

/**
 * Saves or updates a single course in IndexedDB.
 */
export async function saveCourseToIndexedDB(course: Course): Promise<void> {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(course);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (err) {
    console.error('IndexedDB saveCourse failed:', err);
  }
}

/**
 * Saves multiple courses in IndexedDB within a single transaction.
 */
export async function saveCoursesToIndexedDB(courses: Course[]): Promise<void> {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      courses.forEach(course => {
        store.put(course);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('IndexedDB saveCourses failed:', err);
  }
}

/**
 * Deletes a course from IndexedDB by ID.
 */
export async function deleteCourseFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (err) {
    console.error('IndexedDB deleteCourse failed:', err);
  }
}

/**
 * Migrates legacy course history in localStorage to IndexedDB.
 * Safe to call repeatedly; clears legacy localStorage history if migrated successfully.
 */
export async function migrateLocalStorageToIndexedDB(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const storedHistory = localStorage.getItem('synapse_course_history');
    if (storedHistory) {
      const history = JSON.parse(storedHistory) as Course[];
      if (Array.isArray(history) && history.length > 0) {
        await saveCoursesToIndexedDB(history);
        console.log(`Successfully migrated ${history.length} courses from localStorage to IndexedDB.`);
        localStorage.removeItem('synapse_course_history');
      } else {
        // Clear empty/invalid values to free up localStorage keys
        localStorage.removeItem('synapse_course_history');
      }
    }
  } catch (err) {
    console.error('Migration to IndexedDB failed:', err);
  }
}
