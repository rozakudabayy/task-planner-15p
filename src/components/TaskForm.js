import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

const TaskForm = ({ addTask, updateTask, editingTask, setEditingTask }) => {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState(''); 
  const [priority, setPriority] = useState('normal');
  const [showForm, setShowForm] = useState(false);
  
  // When starting to edit a task
  useEffect(() => {
    if (editingTask) {
      setText(editingTask.text);
      setShowForm(true);
      
      // Process date and time from full deadline date
      if (editingTask.dueDate) {
        const dueDateTime = new Date(editingTask.dueDate);
        
        // Format date as YYYY-MM-DD for input field
        const formattedDate = dueDateTime.toISOString().split('T')[0];
        setDueDate(formattedDate);
        
        // Format time as HH:MM for input field
        const hours = dueDateTime.getHours().toString().padStart(2, '0');
        const minutes = dueDateTime.getMinutes().toString().padStart(2, '0');
        setDueTime(`${hours}:${minutes}`);
      } else {
        setDueDate('');
        setDueTime('');
      }
      
      setPriority(editingTask.priority || 'normal');
    }
  }, [editingTask]);
  
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    if (text.trim() === '') {
      setShowForm(false);
      return;
    }
    
    // Create a full date by combining date and time
    let fullDueDate = null;
    if (dueDate) {
      if (dueTime) {
        // If time is specified, create a full date with time
        const [hours, minutes] = dueTime.split(':');
        fullDueDate = new Date(dueDate);
        fullDueDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      } else {
        // If time is not specified, use end of day (23:59)
        fullDueDate = new Date(dueDate);
        fullDueDate.setHours(23, 59, 59);
      }
    }
    
    const dueDateISOString = fullDueDate ? fullDueDate.toISOString() : null;
    
    if (editingTask) {
      updateTask(editingTask.id, text, dueDateISOString, priority);
      setEditingTask(null);
    } else {
      addTask(text, dueDateISOString, priority);
    }
    
    // Reset form
    setText('');
    setDueDate('');
    setDueTime('');
    setPriority('normal');
    setShowForm(false);
  };
  
  const handleCancel = () => {
    setEditingTask(null);
    setText('');
    setDueDate('');
    setDueTime('');
    setPriority('normal');
    setShowForm(false);
  };
  
  const openTaskForm = () => {
    setShowForm(true);
  };
  
  // Get current date for minimum date in date picker
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <>
      {/* Floating add task button */}
      {!showForm && (
        <div className="fixed bottom-8 right-4 z-10">
          <button
            onClick={openTaskForm}
            className="w-14 h-14 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg hover:bg-pink-600 transition-colors"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>
      )}
      
      {/* Form for creating/editing task */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-4">
            <h2 className="text-xl font-bold mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter task..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  autoFocus
                />
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    min={today}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                >
                  {editingTask ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskForm;