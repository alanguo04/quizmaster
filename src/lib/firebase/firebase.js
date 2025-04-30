import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
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
const analytics = getAnalytics(app);
const storage = getStorage(app);

export { storage };