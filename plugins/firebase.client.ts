// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBJgFLhFAxHi9AlAy08QjROGJ9MtWvyGq0",
  authDomain: "poliigo-f1a90.firebaseapp.com",
  projectId: "poliigo-f1a90",
  storageBucket: "poliigo-f1a90.firebasestorage.app",
  messagingSenderId: "901244524276",
  appId: "1:901244524276:web:6863b1faff0fe68502f0a1",
  measurementId: "G-0DLWS8SCV8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to Firestore emulator in development/test environments
if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  console.log("🔥 Connecting to Firestore emulator...");
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("✅ Firestore emulator connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect to Firestore emulator:", error);
  }
}

export { app, db };
