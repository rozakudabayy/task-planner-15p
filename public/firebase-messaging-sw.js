// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
    apiKey: "AIzaSyAgerrIAlHOUTUSNWuX0RCwdySmzS1xGQ8",
    authDomain: "daily-task-planner-c8a1a.firebaseapp.com",
    projectId: "daily-task-planner-c8a1a",
    storageBucket: "daily-task-planner-c8a1a.firebasestorage.app",
    messagingSenderId: "437542977622",
    appId: "1:437542977622:web:f544ff92cf80d9e54b7bf7"
});

// Get Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});