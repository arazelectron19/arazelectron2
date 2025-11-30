import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCVyJZRG7KdpQ2YLxoGVh8e7BlMQcbbPuc",
  authDomain: "araz-electron.firebaseapp.com",
  projectId: "araz-electron",
  storageBucket: "araz-electron.firebasestorage.app",
  messagingSenderId: "499996917044",
  appId: "1:499996917044:web:1a292829fae16490be7961",
  measurementId: "G-JKS3VCWXP5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Local development üçün emulator (istəsəniz)
// if (window.location.hostname === "localhost") {
//   connectFunctionsEmulator(functions, "localhost", 5001);
// }
