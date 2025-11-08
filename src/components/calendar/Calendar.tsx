'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (checkIn: Date | null, checkOut: Date | null) => void;
  selectedCheckIn?: Date | null;
  selectedCheckOut?: Date | null;
  selectionMode?: 'checkin' | 'checkout' | 'both'; // New prop to control selection mode
  autoConfirm?: boolean; // Auto-close after selecting check-in
}

export default function Calendar({ 
  isOpen, 
  onClose, 
  onDateSelect, 
  selectedCheckIn, 
  selectedCheckOut,
  selectionMode = 'both',
  autoConfirm = false
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checkInDate, setCheckInDate] = useState<Date | null>(selectedCheckIn || null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(selectedCheckOut || null);
  
  // Sync with props when they change
  useEffect(() => {
    setCheckInDate(selectedCheckIn || null);
    setCheckOutDate(selectedCheckOut || null);
  }, [selectedCheckIn, selectedCheckOut]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getNextMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  };

  const isDateSelected = (date: Date) => {
    if (!checkInDate && !checkOutDate) return false;
    if (checkInDate && checkOutDate) {
      return date.getTime() === checkInDate.getTime() || date.getTime() === checkOutDate.getTime();
    }
    return checkInDate?.getTime() === date.getTime() || checkOutDate?.getTime() === date.getTime();
  };

  const isDateInRange = (date: Date) => {
    if (!checkInDate || !checkOutDate) return false;
    return date > checkInDate && date < checkOutDate;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    
    // If selecting check-out, disable dates before or equal to check-in
    if (selectionMode === 'checkout' && checkInDate) {
      return date <= checkInDate;
    }
    
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (selectionMode === 'checkin') {
      // Only selecting check-in
      setCheckInDate(date);
      if (autoConfirm) {
        onDateSelect(date, checkOutDate);
        onClose();
      }
    } else if (selectionMode === 'checkout') {
      // Only selecting check-out
      if (checkInDate && date > checkInDate) {
        setCheckOutDate(date);
        if (autoConfirm) {
          onDateSelect(checkInDate, date);
          onClose();
        }
      }
    } else {
      // Both dates selection (original behavior)
      if (!checkInDate || (checkInDate && checkOutDate)) {
        // Start new selection
        setCheckInDate(date);
        setCheckOutDate(null);
      } else if (checkInDate && !checkOutDate) {
        // Complete selection
        if (date > checkInDate) {
          setCheckOutDate(date);
        } else {
          setCheckInDate(date);
          setCheckOutDate(null);
        }
      }
    }
  };

  const handleConfirm = () => {
    onDateSelect(checkInDate, checkOutDate);
    onClose();
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  if (!isOpen) return null;

  const currentMonth = getDaysInMonth(currentDate);
  const nextMonth = getNextMonth(currentDate);
  const nextMonthDays = getDaysInMonth(nextMonth);

  return (
    <div className="bg-white rounded-xl shadow-2xl p-4 w-96">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-800">Select Dates</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-lg"
        >
          ×
        </button>
      </div>

        <div className="flex gap-4">
          {/* Current Month */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={handlePreviousMonth}
                className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800"
              >
                <ChevronLeftIcon className="w-3 h-3" />
              </button>
              <h3 className="text-sm font-bold text-gray-800">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="w-5"></div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {days.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {currentMonth.map((date, index) => (
                <button
                  key={index}
                  onClick={() => date && handleDateClick(date)}
                  disabled={date ? isDateDisabled(date) : false}
                  className={`
                    h-6 w-6 rounded text-xs font-medium transition-colors
                    ${!date ? '' : 
                      isDateDisabled(date) ? 'text-gray-300 cursor-not-allowed' :
                      isDateSelected(date) ? 'bg-orange-500 text-white font-bold' :
                      isDateInRange(date) ? 'bg-orange-100 text-orange-800 font-bold' :
                      'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {date?.getDate()}
                </button>
              ))}
            </div>
          </div>

          {/* Next Month */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="w-5"></div>
              <h3 className="text-sm font-bold text-gray-800">
                {months[nextMonth.getMonth()]} {nextMonth.getFullYear()}
              </h3>
              <button
                onClick={handleNextMonth}
                className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800"
              >
                <ChevronRightIcon className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {days.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {nextMonthDays.map((date, index) => (
                <button
                  key={index}
                  onClick={() => date && handleDateClick(date)}
                  disabled={date ? isDateDisabled(date) : false}
                  className={`
                    h-6 w-6 rounded text-xs font-medium transition-colors
                    ${!date ? '' : 
                      isDateDisabled(date) ? 'text-gray-300 cursor-not-allowed' :
                      isDateSelected(date) ? 'bg-orange-500 text-white font-bold' :
                      isDateInRange(date) ? 'bg-orange-100 text-orange-800 font-bold' :
                      'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {date?.getDate()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {selectionMode === 'both' && (
            <button
              onClick={handleConfirm}
              disabled={!checkInDate || !checkOutDate}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Confirm Dates
            </button>
          )}
          {selectionMode === 'checkin' && checkInDate && !autoConfirm && (
            <button
              onClick={() => {
                onDateSelect(checkInDate, checkOutDate);
                onClose();
              }}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-600"
            >
              Confirm Check-in
            </button>
          )}
          {selectionMode === 'checkout' && checkOutDate && !autoConfirm && (
            <button
              onClick={() => {
                onDateSelect(checkInDate, checkOutDate);
                onClose();
              }}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-600"
            >
              Confirm Check-out
            </button>
          )}
        </div>
      </div>
  );
}
