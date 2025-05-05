import React from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, toggleComplete, deleteTask, startEditing, showCompleted }) => {
  // Sort tasks: overdue and uncompleted first, then by priority and type
  const sortedTasks = [...tasks].sort((a, b) => {
    // First priority - uncompleted tasks
    if (!a.completed && b.completed) return -1;
    if (a.completed && !b.completed) return 1;
    
    // For tasks with same completion status, check overdue
    if (!a.completed && !b.completed) {
      const now = new Date();
      const aOverdue = a.dueDate && new Date(a.dueDate) < now;
      const bOverdue = b.dueDate && new Date(b.dueDate) < now;
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
    }
    
    // Next priority - task category
    const categoryOrder = {
      'Self care': 1,
      'Journal': 2,
      'Water': 3,
      'Bodycare': 4,
      'Duolingo': 5,
      'Read': 6
    };
    
    const getCategoryFromText = (text) => {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('care') || lowerText.includes('teeth')) return 'Self care';
      if (lowerText.includes('journal')) return 'Journal';
      if (lowerText.includes('water')) return 'Water';
      if (lowerText.includes('bodycare') || lowerText.includes('shower')) return 'Bodycare';
      if (lowerText.includes('duolingo')) return 'Duolingo';
      if (lowerText.includes('read')) return 'Read';
      return 'Other';
    };
    
    const aCategory = getCategoryFromText(a.text);
    const bCategory = getCategoryFromText(b.text);
    
    if (categoryOrder[aCategory] && categoryOrder[bCategory]) {
      return categoryOrder[aCategory] - categoryOrder[bCategory];
    }
    
    // Then by priority
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    // Then by due date (closer deadlines first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else if (a.dueDate) {
      return -1;
    } else if (b.dueDate) {
      return 1;
    }
    
    // Finally by ID (creation time)
    return a.id - b.id;
  });

  // Filter for displaying tasks
  const filteredTasks = showCompleted 
    ? sortedTasks 
    : sortedTasks.filter(task => !task.completed);
  
  return (
    <div className="space-y-3">
      {filteredTasks.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          {showCompleted 
            ? "You don't have any tasks yet."
            : "You don't have any active tasks. All tasks are completed!"}
        </div>
      ) : (
        filteredTasks.map(task => (
          <TaskItem 
            key={task.id}
            task={task}
            toggleComplete={toggleComplete}
            deleteTask={deleteTask}
            startEditing={startEditing}
          />
        ))
      )}
    </div>
  );
};

export default TaskList;