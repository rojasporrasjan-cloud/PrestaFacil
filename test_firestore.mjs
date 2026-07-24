import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDu-fM-TWFIW6Le0v0KEqZNR9remR_7bBs",
  authDomain: "prestamos-yuya.firebaseapp.com",
  projectId: "prestamos-yuya",
  storageBucket: "prestamos-yuya.firebasestorage.app",
  messagingSenderId: "330602149715",
  appId: "1:330602149715:web:2fc4aab2ac98a910bf13a6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  console.log("Connecting to Firestore...");
  try {
    const userRef = doc(db, 'users', 'test-user-id');
    await setDoc(userRef, { test: true }, { merge: true });
    console.log("SUCCESS!");
  } catch (error) {
    console.error("ERROR:", error.message, error.code);
  }
  process.exit(0);
}

test();
