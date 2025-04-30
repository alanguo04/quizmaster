import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage, ref, uploadBytes } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Get a reference to the storage service, which is used to create references in your storage bucket
const storage = getStorage();
// Create a storage reference from our storage service
const storageRef = ref(storage);

// const analytics = getAnalytics(app);

// Make a function to upload a file to Firebase Storage
export const uploadFile = async (file) => {
  const fileRef = ref(storage, `uploads/${file.name}`);
  uploadBytes(fileRef, file).then((snapshot) => {
    console.log('Uploaded a blob or file!');
  });
};


export { storage };
