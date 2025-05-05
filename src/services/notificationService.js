import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp
} from 'firebase/firestore';

// Collection for storing device tokens
const tokensCollection = collection(db, 'fcmTokens');

// Collection for storing notifications
const notificationsCollection = collection(db, 'notifications');

// Save user's FCM token
export const saveUserToken = async (userId, token) => {
  try {
    // Check if token already exists
    const q = query(tokensCollection, where('token', '==', token));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // If token doesn't exist, add it
      await addDoc(tokensCollection, {
        userId,
        token,
        createdAt: serverTimestamp()
      });
      console.log('FCM Token saved');
    } else {
      console.log('FCM Token already exists');
    }
  } catch (error) {
    console.error('Error saving FCM Token:', error);
  }
};

// Create notification to send via Cloud Functions
export const createNotification = async (userId, title, body, data = {}) => {
  try {
    // Get user's device tokens
    const q = query(tokensCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No device tokens found for user');
      return;
    }
    
    // Create notification record for each token
    const tokens = querySnapshot.docs.map(doc => doc.data().token);
    
    await addDoc(notificationsCollection, {
      userId,
      title,
      body,
      data,
      tokens,
      sent: false,
      createdAt: serverTimestamp()
    });
    
    console.log('Notification created for sending');
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Format date and time
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// For overdue task notifications
export const sendDueTaskNotification = async (userId, taskText) => {
  await createNotification(
    userId,
    'Task deadline has passed',
    `Task "${taskText}" is overdue!`,
    { type: 'due_task' }
  );
};

// For 1 hour before deadline notifications
export const sendOneHourTaskNotification = async (userId, taskText, dueDate) => {
  const formattedDate = formatDateTime(dueDate);
  
  await createNotification(
    userId,
    'One hour until deadline!',
    `Task "${taskText}" is due at ${formattedDate} (in 1 hour)`,
    { type: 'one_hour_task' }
  );
};

// For upcoming deadline notifications (less than 24 hours)
export const sendUpcomingTaskNotification = async (userId, taskText, dueDate) => {
  const formattedDate = formatDateTime(dueDate);
  
  await createNotification(
    userId,
    'Task deadline approaching',
    `Task "${taskText}" is due at ${formattedDate}`,
    { type: 'upcoming_task' }
  );
};