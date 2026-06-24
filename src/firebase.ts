import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "japantravel-8e369",
  appId: "1:473684537567:web:83fa8492b9f5033a78b96a",
  apiKey: "AIzaSyCHAQijbCdeWpxTsJyqzBhqucyWWyQPJVw",
  authDomain: "japantravel-8e369.firebaseapp.com",
  storageBucket: "japantravel-8e369.firebasestorage.app",
  messagingSenderId: "473684537567",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signIn = async () => {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error("Authentication failed:", error);
  }
};
