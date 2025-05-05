import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Tasks collection
const tasksCollection = collection(db, 'tasks');

// Show local notification in browser
export const showLocalNotification = async (title, body, type) => {
  try {
    // Check browser notification support
    if (!("Notification" in window)) {
      console.warn("This browser doesn't support notifications");
      return false;
    }

    // Check permission
    if (Notification.permission === "granted") {
      // If all good, create notification
      const notification = new Notification(title, {
        body: body,
        icon: '/logo192.png',
        tag: `notification-${Date.now()}`
      });

      // Handle click on notification
      notification.onclick = function() {
        window.focus();
        notification.close();
      };

      return true;
    } else if (Notification.permission !== "denied") {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        return showLocalNotification(title, body, type);
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error showing notification:", error);
    return false;
  }
};

// Get all tasks for a specific user
export const getTasks = async (userId) => {
  try {
    console.log("Loading tasks for user:", userId);
    const q = query(
      tasksCollection, 
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    console.log(`Received ${snapshot.docs.length} documents from Firestore`);
    
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Processing task ${doc.id}:`, data);
      
      // Handle createdAt in different formats
      let createdAt = data.createdAt;
      if (createdAt) {
        if (typeof createdAt.toDate === 'function') {
          // This is Firebase Timestamp
          createdAt = createdAt.toDate();
          console.log(`Converted Timestamp to Date for task ${doc.id}`);
        } else if (typeof createdAt === 'string') {
          // This is ISO string
          createdAt = new Date(createdAt);
          console.log(`Converted string to Date for task ${doc.id}`);
        } else if (createdAt instanceof Date) {
          // This is already Date, do nothing
          console.log(`createdAt is already Date for task ${doc.id}`);
        } else {
          // Unknown format, use current date
          console.warn(`Unknown createdAt format for task ${doc.id}:`, createdAt);
          createdAt = new Date();
        }
      } else {
        console.warn(`createdAt is missing for task ${doc.id}`);
        createdAt = new Date(); // If field is missing, use current date
      }
      
      // Handle dueDate
      let dueDate = data.dueDate;
      if (dueDate) {
        if (typeof dueDate.toDate === 'function') {
          dueDate = dueDate.toDate();
        } else if (typeof dueDate === 'string') {
          dueDate = new Date(dueDate);
        }
        // If it's already Date, do nothing
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt,
        dueDate
      };
    });
    
    // Sort tasks after retrieval (as orderBy might not work with different data types)
    tasks.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt - a.createdAt; // From newest to oldest
    });
    
    console.log(`Successfully loaded and processed ${tasks.length} tasks`);
    return tasks;
  } catch (error) {
    console.error("Error getting tasks:", error);
    return [];
  }
};

// Add new task
export const addTask = async (userId, text, dueDate, priority) => {
  try {
    console.log("Adding new task:", { text, dueDate, priority });
    
    const task = {
      text,
      completed: false,
      dueDate: dueDate || null,
      priority: priority || 'normal',
      notified: false,
      oneHourNotified: false,
      upcomingNotified: false,
      userId,
      createdAt: serverTimestamp() // Use serverTimestamp for database
    };
    
    console.log("Data to save:", task);
    const docRef = await addDoc(tasksCollection, task);
    console.log(`Task successfully added with ID: ${docRef.id}`);
    
    // Return object for UI with local timestamp for immediate display
    const clientTask = {
      id: docRef.id,
      ...task,
      createdAt: new Date() // Local timestamp
    };
    
    console.log("Task for UI display:", clientTask);
    return clientTask;
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

// Update task
export const updateTask = async (taskId, data) => {
  try {
    console.log(`Updating task ${taskId}:`, data);
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, data);
    console.log(`Task ${taskId} successfully updated`);
    return true;
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
};

// Delete task
export const deleteTask = async (taskId) => {
  try {
    console.log(`Deleting task ${taskId}`);
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
    console.log(`Task ${taskId} successfully deleted`);
    return true;
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    throw error;
  }
};

// Mark task as completed or uncompleted
export const toggleTaskComplete = async (taskId, completed) => {
  try {
    console.log(`Changing task status ${taskId} to ${completed ? 'completed' : 'not completed'}`);
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { completed });
    console.log(`Task ${taskId} status successfully updated`);
    return true;
  } catch (error) {
    console.error(`Error changing task status ${taskId}:`, error);
    throw error;
  }
};

// Format date and time
const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Received invalid date:", dateString);
      return "Unknown date";
    }
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Date error";
  }
};

// For overdue task notifications
export const sendDueTaskNotification = async (userId, taskText) => {
  return showLocalNotification(
    'Task deadline has passed',
    `Task "${taskText}" is overdue!`,
    'due'
  );
};

// For 1 hour before deadline notifications
export const sendOneHourTaskNotification = async (userId, taskText, dueDate) => {
  const formattedDate = formatDateTime(dueDate);
  
  return showLocalNotification(
    'One hour until deadline!',
    `Task "${taskText}" is due at ${formattedDate} (in 1 hour)`,
    'oneHour'
  );
};

// For upcoming deadline notifications (less than 24 hours)
export const sendUpcomingTaskNotification = async (userId, taskText, dueDate) => {
  const formattedDate = formatDateTime(dueDate);
  
  return showLocalNotification(
    'Task deadline approaching',
    `Task "${taskText}" is due at ${formattedDate}`,
    'upcoming'
  );
};