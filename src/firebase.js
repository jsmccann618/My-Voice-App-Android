import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAMptXnYzKpKMJZkRgdhvftRl_4BZzKoTk",
  authDomain: "my-voice-app-1b454.firebaseapp.com",
  projectId: "my-voice-app-1b454",
  storageBucket: "my-voice-app-1b454.firebasestorage.app",
  messagingSenderId: "452280740678",
  appId: "1:452280740678:web:2a0163028c98b1e3a95347"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const HOME_DOC_REF = doc(db, "myvoice", "appdata");
const SCHOOL_DOC_REF = doc(db, "myvoice", "school_appdata");

const LS_KEY_HOME   = "myvoice_data_home";
const LS_KEY_SCHOOL = "myvoice_data_school";

function getDocRef(mode) {
  return mode === "school" ? SCHOOL_DOC_REF : HOME_DOC_REF;
}

function getLSKey(mode) {
  return mode === "school" ? LS_KEY_SCHOOL : LS_KEY_HOME;
}

// Save to localStorage backup
function saveLocal(mode, data) {
  try { localStorage.setItem(getLSKey(mode), JSON.stringify(data)); } catch {}
}

// Load from localStorage backup
function loadLocal(mode) {
  try {
    const raw = localStorage.getItem(getLSKey(mode));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Firestore ────────────────────────────────────────────────────────────────
export async function loadFromFirestore(seedData, mode = "home") {
  // Try Firestore with a 6 second timeout
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 6000)
    );
    const snap = await Promise.race([getDoc(getDocRef(mode)), timeoutPromise]);
    if (snap.exists()) {
      const data = snap.data();
      saveLocal(mode, data); // always update local backup when online
      return data;
    }
    // First run — save seed data
    await setDoc(getDocRef(mode), seedData);
    saveLocal(mode, seedData);
    return seedData;
  } catch (e) {
    console.warn("Firestore unavailable, using local backup:", e.message);
    // Offline or timed out — use localStorage backup
    const local = loadLocal(mode);
    if (local) return local;
    return seedData;
  }
}

export async function saveToFirestore(data, mode = "home") {
  saveLocal(mode, data); // always save locally immediately
  try {
    await setDoc(getDocRef(mode), data);
  } catch (e) {
    console.error("Firestore save error:", e);
    // Data is already saved locally — it will sync next time online
  }
}

// ─── Firebase Storage (photos) ────────────────────────────────────────────────
export async function uploadPhoto(base64Data, path) {
  try {
    const storageRef = ref(storage, path);
    const base64String = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const format = base64Data.includes("jpeg") ? "jpeg" : "png";
    await uploadString(storageRef, base64String, "base64", { contentType: `image/${format}` });
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (e) {
    console.error("Storage upload error:", e);
    return null;
  }
}

export async function deletePhoto(path) {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (e) {
    console.error("Storage delete error:", e);
  }
}

