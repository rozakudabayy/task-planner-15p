import React, { useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const FCMNotification = ({ setNotifications }) => {
  // Effect to check unread notifications when user logs in
  useEffect(() => {
    // Get current user
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      
      try {
        // Check if browser notifications are allowed
        if ("Notification" in window && Notification.permission === "default") {
          // Request permission for notifications if not yet determined
          Notification.requestPermission();
        }
      } catch (error) {
        console.error('Error setting up browser notifications:', error);
      }
    });
    
    return () => {
      unsubscribeAuth();
    };
  }, [setNotifications]);

  // Component doesn't render anything
  return null;
};

export default FCMNotification;