import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgerrIAlHOUTUSNWuX0RCwdySmzS1xGQ8",
  authDomain: "daily-task-planner-c8a1a.firebaseapp.com",
  projectId: "daily-task-planner-c8a1a",
  storageBucket: "daily-task-planner-c8a1a.firebasestorage.app",
  messagingSenderId: "437542977622",
  appId: "1:437542977622:web:f544ff92cf80d9e54b7bf7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Function to request notification permission
export const requestNotificationPermission = async () => {
  try {
    if (!("Notification" in window)) {
      console.warn("This browser doesn't support notifications");
      return null;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission not granted');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};