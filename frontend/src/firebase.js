import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVyJZRG7kdpQ2Y1xoGVH8e7BIMqobbPuc",
  authDomain: "araz-electron.firebaseapp.com",
  projectId: "araz-electron",
  storageBucket: "araz-electron.firebasestorage.app",
  messagingSenderId: "499996917044",
  appId: "1:499996917044:web:1a292829fae16490be7961"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
