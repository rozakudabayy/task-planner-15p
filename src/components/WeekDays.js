import React, { useState, useEffect } from 'react';

const WeekDays = ({ onDateSelect }) => {
  // Сокращенные названия дней недели
  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  // Состояние для хранения дат текущей недели
  const [weekDates, setWeekDates] = useState([]);
  // Индекс активного дня
  const [activeDay, setActiveDay] = useState(0);
  
  // Функция для получения даты начала недели (понедельник)
  const getMonday = (date) => {
    const day = date.getDay();
    // В JavaScript воскресенье = 0, поэтому для понедельника нужно особое условие
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };
  
  // Функция для генерации дат недели начиная с понедельника
  const generateWeekDates = () => {
    const today = new Date();
    const monday = getMonday(new Date(today));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  // Функция для определения индекса сегодняшней даты в массиве
  const getTodayIndex = (dates) => {
    const today = new Date();
    return dates.findIndex(date => 
      date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear()
    );
  };
  
  // При монтировании компонента генерируем даты и выбираем сегодняшний день
  useEffect(() => {
    const dates = generateWeekDates();
    setWeekDates(dates);
    
    // Выбираем сегодняшний день или понедельник, если сегодня не входит в эту неделю
    const todayIndex = getTodayIndex(dates);
    const defaultIndex = todayIndex !== -1 ? todayIndex : 0;
    setActiveDay(defaultIndex);
    
    // Вызываем обработчик с выбранной датой
    if (onDateSelect) {
      onDateSelect(dates[defaultIndex]);
    }
  }, []);
  
  // Функция для изменения активного дня при клике
  const handleDayClick = (index) => {
    setActiveDay(index);
    
    // Если обработчик выбора даты предоставлен, вызываем его
    if (onDateSelect) {
      onDateSelect(weekDates[index]);
    }
  };
  
  return (
    <div className="flex justify-between mb-4">
      {weekDates.map((date, index) => {
        const isActive = index === activeDay;
        const dayNumber = date.getDate();
        
        // Проверяем, является ли дата сегодняшней
        const today = new Date();
        const isToday = 
          date.getDate() === today.getDate() && 
          date.getMonth() === today.getMonth() && 
          date.getFullYear() === today.getFullYear();
        
        return (
          <div 
            key={index} 
            className="flex flex-col items-center cursor-pointer"
            onClick={() => handleDayClick(index)}
          >
            <div className="text-gray-500 text-xs mb-1">{daysOfWeek[index]}</div>
            <div className={`w-8 h-8 flex items-center justify-center rounded-full 
                            ${isActive ? 'bg-pink-500 text-white' : isToday ? 'border-2 border-pink-500 text-gray-700' : 'border border-pink-300 text-gray-700'}
                            transition-all duration-200 hover:border-pink-500`}>
              {dayNumber}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeekDays;