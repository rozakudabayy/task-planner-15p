import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import WeekDays from './components/WeekDays';
import NotificationItem from './components/NotificationItem';
import Auth from './components/Auth';
import * as taskService from './services/taskService';
import FCMNotification from './components/FCMNotification';
import { requestNotificationPermission } from './firebase';
import { CheckSquare, CheckCircle, Circle } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); 
    
  // Authentication state tracking
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Request notification permission and get FCM token
  useEffect(() => {
    const setupFCM = async () => {
      if (user) {
        try {
          const token = await requestNotificationPermission();
          if (token) {
            setFcmToken(token);
            console.log("FCM token received:", token);
          }
        } catch (error) {
          console.error("Error setting up FCM:", error);
        }
      }
    };
    
    if (user) {
      setupFCM();
    }
  }, [user]);
  
  // Load tasks from Firebase
  useEffect(() => {
    const loadTasks = async () => {
      if (user) {
        try {
          console.log("Loading tasks for user:", user.uid);
          const userTasks = await taskService.getTasks(user.uid);
          
          if (userTasks.length > 0) {
            console.log(`Loaded ${userTasks.length} tasks`);
            setTasks(userTasks);
          } else {
            console.log("No tasks found");
            setTasks([]);
          }

          if (userTasks.some(task => !task.createdAt)) {
            console.warn("Warning: tasks without createdAt timestamp detected");
          }
        } catch (error) {
          console.error("Error loading tasks:", error);
        }
      } else {
        setTasks([]);
      }
    };
    
    if (user) {
      loadTasks();
      const refreshInterval = setInterval(loadTasks, 180000);
      return () => clearInterval(refreshInterval);
    }
  }, [user]);
  
  // Filter tasks by selected date
  useEffect(() => {
    // Function to filter tasks by date
    const filterTasksByDate = () => {
      if (!selectedDate) {
        setFilteredTasks(tasks);
        return;
      }
      
      const filtered = tasks.filter(task => {
        if (!task.dueDate) return false;
        
        const taskDate = new Date(task.dueDate);
        return (
          taskDate.getDate() === selectedDate.getDate() &&
          taskDate.getMonth() === selectedDate.getMonth() &&
          taskDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      
      setFilteredTasks(filtered);
    };
    
    filterTasksByDate();
  }, [tasks, selectedDate, showCompleted]);
  
  // Handle date selection from WeekDays component
  const handleDateSelect = (date) => {
    console.log("Selected date:", date.toISOString().split('T')[0]);
    setSelectedDate(date);
  };
  
  // Check for overdue tasks and deadlines
  useEffect(() => {
    if (!user) return;
    
    const checkDueTasks = async () => {
      const now = new Date();
      
      // Check overdue tasks (deadline has passed)
      const dueTasks = tasks.filter(task => {
        if (task.completed || !task.dueDate || task.notified) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate <= now;
      });
      
      // Check tasks with deadline in 1 hour
      const oneHourTasks = tasks.filter(task => {
        if (task.completed || !task.dueDate || task.oneHourNotified) return false;
        const taskDate = new Date(task.dueDate);
        const diffTime = taskDate - now;
        const diffHours = diffTime / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 1;
      });
      
      // Check tasks with upcoming deadline (less than 24 hours)
      const upcomingTasks = tasks.filter(task => {
        if (task.completed || !task.dueDate || task.upcomingNotified) return false;
        const taskDate = new Date(task.dueDate);
        const diffTime = taskDate - now;
        const diffHours = diffTime / (1000 * 60 * 60);
        return diffHours > 1 && diffHours < 24;
      });
      
      // Handle overdue tasks
      if (dueTasks.length > 0) {
        const newNotifications = dueTasks.map(task => ({
          id: Date.now() + Math.random(),
          task: task.text,
          type: 'due'
        }));
        
        setNotifications(prev => [...prev, ...newNotifications]);
        
        // Mark tasks as notified and show browser notifications
        const updatedTasks = [...tasks];
        for (const dueTask of dueTasks) {
          const index = updatedTasks.findIndex(t => t.id === dueTask.id);
          if (index !== -1) {
            updatedTasks[index] = { ...updatedTasks[index], notified: true };
            // Also update in database
            await taskService.updateTask(dueTask.id, { notified: true });
            
            // Show browser notification
            await taskService.sendDueTaskNotification(user.uid, dueTask.text);
          }
        }
        setTasks(updatedTasks);
      }
      
      // Handle tasks with deadline in 1 hour
      if (oneHourTasks.length > 0) {
        const newNotifications = oneHourTasks.map(task => ({
          id: Date.now() + Math.random(),
          task: task.text,
          type: 'oneHour'
        }));
        
        setNotifications(prev => [...prev, ...newNotifications]);
        
        const updatedTasks = [...tasks];
        for (const oneHourTask of oneHourTasks) {
          const index = updatedTasks.findIndex(t => t.id === oneHourTask.id);
          if (index !== -1) {
            updatedTasks[index] = { ...updatedTasks[index], oneHourNotified: true };
            await taskService.updateTask(oneHourTask.id, { oneHourNotified: true });
            await taskService.sendOneHourTaskNotification(user.uid, oneHourTask.text, oneHourTask.dueDate);
          }
        }
        setTasks(updatedTasks);
      }
      
      // Handle tasks with upcoming deadline
      if (upcomingTasks.length > 0) {
        const newNotifications = upcomingTasks.map(task => ({
          id: Date.now() + Math.random(),
          task: task.text,
          type: 'upcoming'
        }));
        
        setNotifications(prev => [...prev, ...newNotifications]);
        
        const updatedTasks = [...tasks];
        for (const upcomingTask of upcomingTasks) {
          const index = updatedTasks.findIndex(t => t.id === upcomingTask.id);
          if (index !== -1) {
            updatedTasks[index] = { ...updatedTasks[index], upcomingNotified: true };
            await taskService.updateTask(upcomingTask.id, { upcomingNotified: true });
            await taskService.sendUpcomingTaskNotification(user.uid, upcomingTask.text, upcomingTask.dueDate);
          }
        }
        setTasks(updatedTasks);
      }
    };
    
    // Check tasks every minute
    const interval = setInterval(checkDueTasks, 60000);
    checkDueTasks(); // Initial check
    
    return () => clearInterval(interval);
  }, [user, tasks]);
  
  // Add task
  const addTask = async (text, dueDate, priority) => {
    if (!user) return;
    
    try {
      const newTask = await taskService.addTask(user.uid, text, dueDate, priority);
      setTasks([newTask, ...tasks]);
      
      // Add notification about creation
      setNotifications([
        ...notifications, 
        { id: Date.now(), task: text, type: 'created' }
      ]);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };
  
  // Update task
  const updateTask = async (taskId, text, dueDate, priority) => {
    try {
      await taskService.updateTask(taskId, { text, dueDate, priority });
      
      // Update local state
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, text, dueDate, priority };
        }
        return task;
      }));
      
      // Add notification about edit
      setNotifications([
        ...notifications, 
        { id: Date.now(), task: text, type: 'edited' }
      ]);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };
  
  // Delete task
  const deleteTask = async (taskId) => {
    try {
      const taskToDelete = tasks.find(task => task.id === taskId);
      
      await taskService.deleteTask(taskId);
      
      // Update local state
      setTasks(tasks.filter(task => task.id !== taskId));
      
      // Add notification about deletion
      setNotifications([
        ...notifications, 
        { id: Date.now(), task: taskToDelete.text, type: 'deleted' }
      ]);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
  
  // Toggle task completion status
  const toggleComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const newStatus = !task.completed;
      
      await taskService.toggleTaskComplete(taskId, newStatus);
      
      // Update local state
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, completed: newStatus };
        }
        return task;
      }));
      
      // Add notification about completion if task is marked as completed
      if (newStatus) {
        setNotifications([
          ...notifications, 
          { id: Date.now(), task: task.text, type: 'completed' }
        ]);
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };
  
  // Start task editing
  const startEditing = (task) => {
    setEditingTask(task);
  };
  
  // Remove notification
  const removeNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  // Toggle showing completed tasks
  const toggleShowCompleted = () => {
    setShowCompleted(!showCompleted);
  };
  
  // Get stats for tasks
  const getTaskStats = () => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.completed).length;
    const incompleteTasks = totalTasks - completedTasks;
    const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return { totalTasks, completedTasks, incompleteTasks, percentComplete };
  };
  
  const stats = getTaskStats();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* FCM component */}
      <FCMNotification setNotifications={setNotifications} />
      
      {user ? (
        <div className="max-w-lg mx-auto p-4">
          <div className="flex justify-between items-center mb-4 mt-3">
            <h1 className="text-2xl font-bold text-gray-800">Today</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleShowCompleted}
                className="flex items-center space-x-1 text-blue-500 text-xs hover:text-blue-700"
              >
                {showCompleted ? <CheckSquare className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <span>{showCompleted ? "Hide completed" : "Show completed"}</span>
              </button>
              <button
                onClick={() => auth.signOut()}
                className="text-red-500 text-xs hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Task stats display */}
          {filteredTasks.length > 0 && (
            <div className="mb-3 bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">
                    {stats.incompleteTasks > 0 ? (
                      <span className="font-medium text-red-500">{stats.incompleteTasks} uncompleted</span>
                    ) : (
                      <span className="font-medium text-green-500">All tasks completed</span>
                    )}
                    {stats.completedTasks > 0 && (
                      <span className="text-gray-500"> • {stats.completedTasks} completed</span>
                    )}
                  </p>
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {stats.percentComplete}% done
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${stats.percentComplete}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <WeekDays onDateSelect={handleDateSelect} />
          
          <div className="mb-4 mt-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {showCompleted 
                  ? "You don't have any tasks for this date."
                  : "You don't have any active tasks for this date."}
              </div>
            ) : (
              <TaskList
                tasks={filteredTasks}
                toggleComplete={toggleComplete}
                deleteTask={deleteTask}
                startEditing={startEditing}
                showCompleted={showCompleted}
              />
            )}
          </div>
          
          <TaskForm
            addTask={addTask}
            updateTask={updateTask}
            editingTask={editingTask}
            setEditingTask={setEditingTask}
            selectedDate={selectedDate}
          />
          
          {/* Notifications section */}
          <div className="fixed bottom-4 right-4 w-80">
            {notifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                removeNotification={removeNotification}
                style={{ opacity: 1 - (index * 0.1) }}
              />
            ))}
          </div>
        </div>
      ) : (
        <Auth />
      )}
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default App;