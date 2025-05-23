// lib/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, listAll, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKU1D1v3aFT1OpvtUx394jeQD4PC8Mmpg",
  authDomain: "quiz-master-2b880.firebaseapp.com",
  projectId: "quiz-master-2b880",
  storageBucket: "quiz-master-2b880.firebasestorage.app",
  messagingSenderId: "217695138898",
  appId: "1:217695138898:web:5acc0d55b2ab8fe80e5b8b",
  measurementId: "G-WN5BEQWKFZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
// Initialize Analytics if in browser environment
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Analytics failed to initialize:", error);
  }
}

// Helper function to upload files to Firebase Storage
const uploadFile = async (file) => {
  const fileRef = ref(storage, `uploads/${file.name}`);
  await uploadBytes(fileRef, file);
  console.log('Uploaded a blob or file!');
  const downloadURL = await getDownloadURL(fileRef);
  return downloadURL;
};


export const listFiles = async () => {
  const storage = getStorage();
  const listRef = ref(storage, 'uploads/'); // change 'uploads/' to your actual folder if needed

  try {
    const res = await listAll(listRef);
    const files = await Promise.all(
      res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return { name: itemRef.name, url };
      })
    );
    return files;
  } catch (err) {
    console.error("Error listing files:", err);
    return [];
  }
};

export { db, storage, uploadFile, listFiles };