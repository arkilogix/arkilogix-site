import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ YOUR REAL CONFIG (already correct)
const firebaseConfig = {
  apiKey: "AIzaSyCUw-qxeRg8YaihNcJPmJDHL2z6zBE6PK4",
  authDomain: "arkilogix-clients.firebaseapp.com",
  projectId: "arkilogix-clients",
  storageBucket: "arkilogix-clients.firebasestorage.app",
  messagingSenderId: "1074947351840",
  appId: "1:1074947351840:web:b077eb79963fff59316345"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore
export const db = getFirestore(app);
