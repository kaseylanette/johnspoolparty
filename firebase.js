import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5fIIG56sZZXObFNL65f1nT0aPp_yeD_4",
  authDomain: "big-john-events-741bd.firebaseapp.com",
  projectId: "big-john-events-741bd",
  storageBucket: "big-john-events-741bd.firebasestorage.app",
  messagingSenderId: "791202792517",
  appId: "1:791202792517:web:a92866a7ae26a1897a4f2c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// attach everything to window
window.db = db;
window.firebaseCollection = collection;
window.firebaseAddDoc = addDoc;
window.firebaseGetDocs = getDocs;

console.log("Firebase connected successfully");