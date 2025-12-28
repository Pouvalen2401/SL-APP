class IndexedDBService {
  constructor() {
    this.dbName = 'SignLanguageDB';
    this.version = 1;
    this.db = null;
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          userStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('translations')) {
          const translationStore = db.createObjectStore('translations', {
            keyPath: 'id',
            autoIncrement: true
          });
          translationStore.createIndex('timestamp', 'timestamp', { unique: false });
          translationStore.createIndex('userId', 'userId', { unique: false });
        }

        if (!db.objectStoreNames.contains('avatars')) {
          db.createObjectStore('avatars', { keyPath: 'userId' });
        }
      };
    });
  }

  async saveUser(user) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(user);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUser(id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUsers() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveTranslation(translation) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['translations'], 'readwrite');
      const store = transaction.objectStore('translations');
      const request = store.add({
        ...translation,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTranslationHistory(userId, limit = 50) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['translations'], 'readonly');
      const store = transaction.objectStore('translations');
      const index = store.index('userId');
      const request = index.getAll(userId);
      
      request.onsuccess = () => {
        const results = request.result
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveAvatar(userId, avatarConfig) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['avatars'], 'readwrite');
      const store = transaction.objectStore('avatars');
      const request = store.put({ userId, config: avatarConfig });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAvatar(userId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['avatars'], 'readonly');
      const store = transaction.objectStore('avatars');
      const request = store.get(userId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export default new IndexedDBService();
import { Hands } from '@mediapipe/hands';
import { Pose } from '@mediapipe/pose';
import { FaceMesh } from '@mediapipe/face_mesh';
