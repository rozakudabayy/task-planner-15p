import React, { useState } from 'react';
import { Trash2, Edit, CheckCircle } from 'lucide-react';

const TaskItem = ({ task, toggleComplete, deleteTask, startEditing }) => {
  const [selected, setSelected] = useState(false);
  
  // Function to check for upcoming deadline
  const getTimeStatus = (dueDate) => {
    if (!dueDate) return { isDeadlineSoon: false, isOverdue: false, remainingHours: null };
    
    const now = new Date();
    const taskDate = new Date(dueDate);
    const diffTime = taskDate - now;
    const diffHours = diffTime / (1000 * 60 * 60);
    
    return {
      isDeadlineSoon: diffHours > 0 && diffHours < 1, // Less than an hour to deadline
      isNearDeadline: diffHours > 0 && diffHours < 24, // Less than 24 hours
      isOverdue: diffHours < 0,
      remainingHours: Math.abs(diffHours)
    };
  };
  
  // Get time status
  const timeStatus = task.dueDate ? getTimeStatus(task.dueDate) : { isDeadlineSoon: false, isOverdue: false };
  
  // Function to get card class based on task status
  const getCardClass = () => {
    if (task.completed) {
      return 'bg-sky-100'; // Blue for completed
    } else if (timeStatus.isOverdue || !task.completed) {
      return 'bg-red-100'; // Red for uncompleted and overdue tasks
    } else if (task.priority === 'high') {
      return 'bg-red-100'; // Red for high priority
    } else {
      return task.id % 2 === 0 ? 'bg-pink-100' : 'bg-sky-100'; // Alternating for medium/low priority
    }
  };
  
  // Get text color class based on task status
  const getTextColorClass = () => {
    if (task.completed) {
      return 'text-gray-800 line-through';
    } else if (timeStatus.isOverdue) {
      return 'text-red-700'; // Darker red text for overdue
    } else {
      return 'text-gray-800'; // Default text color
    }
  };
  
  // Get icon for task
  const getTaskIcon = () => {
    // Determine icon based on task text
    if (task.text.toLowerCase().includes('care') || task.text.toLowerCase().includes('teeth')) {
      return '🥤';
    } else if (task.text.toLowerCase().includes('journal')) {
      return '✏️';
    } else if (task.text.toLowerCase().includes('water')) {
      return '💧';
    } else if (task.text.toLowerCase().includes('bodycare') || task.text.toLowerCase().includes('shower')) {
      return '👺';
    } else if (task.text.toLowerCase().includes('duolingo')) {
      return '🎓';
    } else if (task.text.toLowerCase().includes('read')) {
      return '📚';
    } else if (task.text.toLowerCase().includes('presentation')) {
      return '📊';
    } else {
      return '📝';
    }
  };
  
  // Get subtitle for task
  const getTaskSubtitle = () => {
    // Determine subtitle based on task text
    if (task.text.toLowerCase().includes('care') || task.text.toLowerCase().includes('teeth')) {
      return 'Teeth, skincare, haircare';
    } else if (task.text.toLowerCase().includes('journal')) {
      return 'Clearing your mind a lil bit';
    } else if (task.text.toLowerCase().includes('water')) {
      return 'Drinking 4-6 glasses daily💧💦';
    } else if (task.text.toLowerCase().includes('bodycare') || task.text.toLowerCase().includes('shower')) {
      return 'Shower, lotion';
    } else if (task.text.toLowerCase().includes('duolingo')) {
      return 'Lesson';
    } else if (task.text.toLowerCase().includes('read')) {
      return 'At least 2 pages daily';
    } else if (task.text.toLowerCase().includes('presentation')) {
      return 'Prepare slides for meeting';
    } else {
      return '';
    }
  };
  
  const handleToggleSelect = () => {
    setSelected(!selected);
  };
  
  const handleToggleComplete = (e) => {
    e.stopPropagation();
    toggleComplete(task.id);
    setSelected(false);
  };
  
  const handleEdit = (e) => {
    e.stopPropagation();
    startEditing(task);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  };
  
  return (
    <div className="relative">
      <div 
        className={`mb-3 p-4 rounded-lg shadow-sm ${getCardClass()} ${selected ? 'border-2 border-pink-500' : ''}`}
        onClick={handleToggleSelect}
      >
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-xl mt-1">{getTaskIcon()}</div>
          
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <h3 className={`${getTextColorClass()} text-lg font-semibold`}>
                  {task.text} {task.completed ? '✓' : ''}
                </h3>
                <p className="text-gray-500 text-sm">{getTaskSubtitle()}</p>
                
                {/* Show deadline info for uncompleted tasks */}
                {!task.completed && task.dueDate && (
                  <p className={`text-sm mt-1 ${timeStatus.isOverdue ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
                    {timeStatus.isOverdue ? 
                      'Overdue!' : 
                      timeStatus.isDeadlineSoon ? 
                        'Due in less than an hour!' : 
                        `Due: ${new Date(task.dueDate).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}`
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={handleEdit}
            className="text-blue-500 hover:text-blue-700 focus:outline-none"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 focus:outline-none"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Task completion panel - appears when selected */}
      {selected && !task.completed && (
        <div className="flex justify-center mb-4 -mt-2 animate-fadeIn">
          <button
            onClick={handleToggleComplete}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition-colors flex items-center"
          >
            <CheckCircle className="h-5 w-5 mr-2" /> 
            Mark as completed
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskItem;