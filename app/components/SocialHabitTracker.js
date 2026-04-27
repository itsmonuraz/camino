'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getFirestoreDb, getFirebaseAuth, isFirebaseAvailable } from '../lib/firebase';
import { collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useHabits } from '../contexts/HabitsContext';
import LoginModal from './LoginModal';

// User data stored in memory
const userData = {
  "@camino": {
    habits: ["Morning Meditation", "Exercise", "Read 30min", "Drink 8 glasses water", "No social media before 6pm"],
    completions: {
      "2025-10-01": ["Morning Meditation", "Exercise", "Read 30min"],
      "2025-10-02": ["Morning Meditation", "Drink 8 glasses water"],
      "2025-10-03": ["Morning Meditation", "Exercise", "Read 30min", "Drink 8 glasses water"],
      "2025-10-04": ["Morning Meditation", "Read 30min"],
      "2025-10-05": ["Morning Meditation", "Exercise", "Drink 8 glasses water", "No social media before 6pm"],
      "2025-10-06": ["Morning Meditation", "Exercise", "Read 30min"],
      "2025-10-07": ["Morning Meditation"],
      "2025-10-08": ["Morning Meditation", "Exercise", "Read 30min", "Drink 8 glasses water"],
      "2025-10-09": ["Morning Meditation", "Exercise", "Read 30min"],
      "2025-10-10": ["Morning Meditation", "Drink 8 glasses water"],
      "2025-10-11": ["Morning Meditation", "Exercise", "Read 30min", "Drink 8 glasses water"],
      "2025-10-12": ["Morning Meditation", "Read 30min"],
      "2025-10-13": ["Morning Meditation", "Exercise", "Drink 8 glasses water", "No social media before 6pm"],
      "2025-10-14": ["Morning Meditation", "Exercise", "Read 30min"],
      "2025-10-15": ["Morning Meditation"]
    }
  },
  "@jordan": {
    habits: ["5K run", "Practice guitar", "Meal prep", "Call family", "Journal writing"],
    completions: {
      "2025-10-01": ["5K run", "Practice guitar", "Journal writing"],
      "2025-10-02": ["Practice guitar", "Call family", "Journal writing"],
      "2025-10-03": ["5K run", "Practice guitar", "Meal prep"],
      "2025-10-04": ["Practice guitar", "Journal writing"],
      "2025-10-05": ["5K run", "Practice guitar", "Meal prep", "Call family"],
      "2025-10-06": ["Practice guitar", "Journal writing"],
      "2025-10-07": ["5K run", "Practice guitar", "Meal prep"],
      "2025-10-08": ["5K run", "Practice guitar", "Meal prep", "Journal writing"],
      "2025-10-09": ["5K run", "Practice guitar", "Journal writing"],
      "2025-10-10": ["Practice guitar", "Call family", "Journal writing"],
      "2025-10-11": ["5K run", "Practice guitar", "Meal prep"],
      "2025-10-12": ["Practice guitar", "Journal writing"],
      "2025-10-13": ["5K run", "Practice guitar", "Meal prep", "Call family"],
      "2025-10-14": ["Practice guitar", "Journal writing"],
      "2025-10-15": ["5K run", "Practice guitar"]
    }
  },
  "@ti": {
    habits: ["Yoga", "Learn Spanish", "Cook dinner", "Walk dog", "Sleep by 10pm"],
    completions: {
      "2025-10-01": ["Yoga", "Learn Spanish", "Walk dog", "Sleep by 10pm"],
      "2025-10-02": ["Learn Spanish", "Cook dinner", "Walk dog"],
      "2025-10-03": ["Yoga", "Cook dinner", "Walk dog", "Sleep by 10pm"],
      "2025-10-04": ["Learn Spanish", "Walk dog"],
      "2025-10-05": ["Yoga", "Learn Spanish", "Cook dinner", "Walk dog"],
      "2025-10-06": ["Yoga", "Cook dinner", "Sleep by 10pm"],
      "2025-10-07": ["Learn Spanish", "Walk dog"],
      "2025-10-08": ["Yoga", "Learn Spanish", "Cook dinner", "Walk dog", "Sleep by 10pm"],
      "2025-10-09": ["Yoga", "Learn Spanish", "Walk dog", "Sleep by 10pm"],
      "2025-10-10": ["Learn Spanish", "Cook dinner", "Walk dog"],
      "2025-10-11": ["Yoga", "Cook dinner", "Walk dog", "Sleep by 10pm"],
      "2025-10-12": ["Learn Spanish", "Walk dog"],
      "2025-10-13": ["Yoga", "Learn Spanish", "Cook dinner", "Walk dog"],
      "2025-10-14": ["Yoga", "Cook dinner", "Sleep by 10pm"],
      "2025-10-15": ["Learn Spanish", "Walk dog"]
    }
  }
};

// Get current date dynamically
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const currentDate = getCurrentDate();

// Generate date range for current month dynamically
const generateDateRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0 = January, 10 = November)
  
  // Get the number of days in the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dates = [];
  const monthStr = (month + 1).toString().padStart(2, '0');
  
  for (let i = 1; i <= daysInMonth; i++) {
    const day = i.toString().padStart(2, '0');
    dates.push(`${year}-${monthStr}-${day}`);
  }
  return dates;
};

const dateRange = generateDateRange();

// Motivational reminders array
const motivationalReminders = [
  "When you feel unmotivated, don't stop to rest and wait for energy to return. Instead, read articles, review your notes, or watch inspiring videos. These small actions can reignite your motivation and help you get back on track.",
  "The brain gets more dopamine from planning than doing.\nThat's why people have multiple business ideas but zero businesses.",
];

export default function SocialHabitTracker() {
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const { getHabitsForMonth, toggleCompletion, isCompleted: isHabitCompletedInContext, productiveHours, updateProductiveHours, getProductiveHours, updateHabitName, deleteHabitFromMonth, dataLoaded } = useHabits();
  
  // Get current month for habits
  const currentMonthKey = currentDate.substring(0, 7); // "2025-10"
  
  // Determine the current user - use authUser's username if logged in, otherwise use demo
  const currentUser = authUser?.username || "@camino";
  const [viewingUser, setViewingUser] = useState(currentUser);
  
  // Initialize user data - create empty data for new users
  const [userDataState, setUserDataState] = useState(() => {
    if (authUser && !userData[authUser.username]) {
      // New user - initialize with empty habits
      return {
        ...userData,
        [authUser.username]: {
          habits: [],
          completions: {}
        }
      };
    }
    return userData;
  });
  
  // Update viewing user when authUser changes
  useEffect(() => {
    if (authUser?.username) {
      setViewingUser(authUser.username);
      // Ensure user data exists for the logged-in user
      setUserDataState(prevData => {
        if (!prevData[authUser.username]) {
          return {
            ...prevData,
            [authUser.username]: {
              habits: [],
              completions: {}
            }
          };
        }
        return prevData;
      });
    } else {
      // When user signs out, reset to demo user
      setViewingUser("@camino");
    }
  }, [authUser]);
  
  // Test Firebase connection
  useEffect(() => {
    const db = isFirebaseAvailable() ? getFirestoreDb() : null;
    const auth = isFirebaseAvailable() ? getFirebaseAuth() : null;
    console.log('🔥 Firebase DB initialized:', db ? 'Success ✅' : 'Failed ❌');
    console.log('🔐 Firebase Auth initialized:', auth ? 'Success ✅' : 'Failed ❌');
    console.log('📊 Firebase Config:', {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    });
    console.log('👤 User:', authUser ? `Logged in as ${authUser.displayName} (${authUser.username})` : 'Not logged in (viewing demo)');
  }, [authUser]);

  // Check if user is new and show welcome modal
  useEffect(() => {
    if (authUser && typeof window !== 'undefined') {
      const hasSeenWelcome = localStorage.getItem(`welcomeSeen_${authUser.uid}`);
      if (!hasSeenWelcome) {
        // Small delay to let the page load first
        const timer = setTimeout(() => {
          setShowWelcomeModal(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [authUser]);

  // Handle welcome modal close
  const handleWelcomeClose = () => {
    if (authUser && typeof window !== 'undefined') {
      localStorage.setItem(`welcomeSeen_${authUser.uid}`, 'true');
    }
    setShowWelcomeModal(false);
  };
  
  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  
  // Welcome modal state for new users
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Dropdown menu state
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState('system');
  
  // Editing habit state
  const [editingHabitIndex, setEditingHabitIndex] = useState(null);
  const [editingHabitValue, setEditingHabitValue] = useState('');
  
  // State for current motivational reminder - start with first one to avoid hydration mismatch
  const [currentReminder, setCurrentReminder] = useState(motivationalReminders[0]);
  const [isClient, setIsClient] = useState(false);
  
  // State for context menu
  const [contextMenu, setContextMenu] = useState(null);
  
  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);
  
  // Apply theme to document
  const applyTheme = (newTheme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };
  
  // Handle theme change
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };
  
  // Toggle between light and dark theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    changeTheme(newTheme);
  };
  
  // Set random reminder on client mount
  useEffect(() => {
    setIsClient(true);
    const randomIndex = Math.floor(Math.random() * motivationalReminders.length);
    setCurrentReminder(motivationalReminders[randomIndex]);
  }, []);
  
  // Change reminder every 60 seconds
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * motivationalReminders.length);
      setCurrentReminder(motivationalReminders[randomIndex]);
    }, 60000); // 60000ms = 1 minute
    
    return () => clearInterval(interval);
  }, [isClient]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-dropdown')) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Format date for display - just return the day number
  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    return day;
  };

  // Check if a habit is completed on a specific date
  const isHabitCompleted = (user, habit, date) => {
    // If viewing own profile (logged in), use shared context
    if (authUser && user === authUser.username) {
      return isHabitCompletedInContext(date, habit);
    }
    // For demo users, use local state
    const completions = userDataState[user]?.completions[date];
    return completions && completions.includes(habit);
  };

  // Toggle habit completion
  const toggleHabitCompletion = (habit, date) => {
    // If not logged in, show login modal
    if (!authUser) {
      setLoginMessage("Sign in to track your own habits and save your progress");
      setShowLoginModal(true);
      return;
    }
    
    if (viewingUser !== currentUser) return; // Read-only mode
    if (!isToday(date)) return; // Can only toggle today's date

    // Use shared context for logged-in users
    toggleCompletion(date, habit);
  };

  // Check if date is in the future
  const isFutureDate = (date) => {
    return date > currentDate;
  };

  // Check if date is in the past
  const isPastDate = (date) => {
    return date < currentDate;
  };

  // Check if date is today
  const isToday = (date) => {
    return date === currentDate;
  };

  // Handle productive hours input
  const handleProductiveHoursChange = (date, value) => {
    // If not logged in, show login modal
    if (!authUser) {
      setLoginMessage("Sign in to track your productive hours");
      setShowLoginModal(true);
      return;
    }
    
    if (viewingUser !== currentUser) return; // Read-only mode
    if (!isToday(date)) return; // Can only set today's date
    
    // Allow empty input
    if (value === '') {
      updateProductiveHours(date, '');
      return;
    }
    
    // Limit to max 2 decimal places
    const decimalRegex = /^\d*\.?\d{0,2}$/;
    if (!decimalRegex.test(value)) return;
    
    // Validate input: allow decimals for minutes (0-20 hours, .00-.59 for minutes)
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 20) return;
    
    // Check if decimal part (minutes) is valid (0-59)
    const decimalPart = Math.round((numValue % 1) * 100);
    if (decimalPart > 59) return;
    
    updateProductiveHours(date, value);
  };

  // Handle habit name click to start editing
  const handleHabitNameClick = (habitIndex, habitName) => {
    // If not logged in, show login modal
    if (!authUser) {
      setLoginMessage("Sign in to edit your habits");
      setShowLoginModal(true);
      return;
    }
    
    if (viewingUser !== currentUser) return; // Read-only mode
    
    setEditingHabitIndex(habitIndex);
    setEditingHabitValue(habitName);
  };

  // Handle habit name change
  const handleHabitNameChange = (e) => {
    setEditingHabitValue(e.target.value);
  };

  // Handle habit name save
  const handleHabitNameSave = (habitIndex) => {
    if (editingHabitValue.trim() && editingHabitValue !== user.habits[habitIndex]) {
      updateHabitName(currentMonthKey, habitIndex, editingHabitValue.trim());
    }
    setEditingHabitIndex(null);
    setEditingHabitValue('');
  };

  // Handle habit name blur (save on blur)
  const handleHabitNameBlur = (habitIndex) => {
    handleHabitNameSave(habitIndex);
  };

  // Handle habit name key press
  const handleHabitNameKeyPress = (e, habitIndex) => {
    if (e.key === 'Enter') {
      handleHabitNameSave(habitIndex);
    } else if (e.key === 'Escape') {
      setEditingHabitIndex(null);
      setEditingHabitValue('');
    }
  };

  // Handle right-click context menu
  const handleContextMenu = (e, habitIndex, habitName) => {
    if (!authUser) return;
    if (viewingUser !== currentUser) return;
    
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      habitIndex,
      habitName
    });
  };

  // Handle habit deletion
  const handleDeleteHabit = () => {
    if (contextMenu) {
      deleteHabitFromMonth(currentMonthKey, contextMenu.habitIndex);
      setContextMenu(null);
    }
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const isViewingOthers = viewingUser !== currentUser;
  
  // Use shared habits for logged-in users (current month), demo data for others
  const user = authUser && viewingUser === authUser.username
    ? { habits: getHabitsForMonth(currentMonthKey), completions: {} }
    : (userDataState[viewingUser] || { habits: [], completions: {} });

  // Get current month and year
  const getCurrentMonthYear = () => {
    const date = new Date(currentDate + 'T00:00:00');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calculate completion stats for passed days only
  const getCompletionStats = () => {
    let totalCompleted = 0;
    let totalPossible = 0;
    
    // Only count days that have passed (up to and including today)
    const passedDates = dateRange.filter(date => date <= currentDate);
    
    passedDates.forEach(date => {
      user.habits.forEach(habit => {
        totalPossible++;
        if (isHabitCompleted(viewingUser, habit, date)) {
          totalCompleted++;
        }
      });
    });
    
    return { completed: totalCompleted, total: totalPossible };
  };

  // Show empty state message if user has no habits
  const showEmptyState = user.habits.length === 0;
  
  // Show helpful message for logged-in users
  const showHabitsPrompt = authUser && user.habits.length > 0 && user.habits.every(h => h.startsWith('Habit '));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 relative bg-[#fcfcf9] dark:bg-[#1f2121]">
      {/* Sign in prompt for non-logged in users */}
      {!authUser && !authLoading && (
        <div className="mb-4 text-center py-3 px-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            This is only demo data
          </p>
          <button
            onClick={() => {
              setLoginMessage("Sign in to track your own habits and save your progress");
              setShowLoginModal(true);
            }}
            className="text-sm text-green-900 dark:text-green-800 underline hover:text-green-900 dark:hover:text-green-700 transition-colors cursor-pointer bg-transparent border-none font-semibold"
          >
            Sign in to start tracking your habits
          </button>
        </div>
      )}

      <div className="bg-[#fffffe] dark:bg-[#262828] rounded-xl border border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] shadow-md p-4 w-full max-w-[1250px] overflow-x-auto">
        <div className="flex justify-between items-center pl-2 pr-2 mb-4">
          <div className="text-sm font-medium text-[#13343b] dark:text-[#f5f5f5]">
            {getCurrentMonthYear()}
          </div>
          <div className="text-sm font-medium text-[#13343b] dark:text-[#f5f5f5]">
            {isClient ? `${getCompletionStats().completed}/${getCompletionStats().total}` : '0/0'}
          </div>
        </div>

        {/* Desktop Table */}
        {!showEmptyState && isClient && (
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr>
                <th className="text-left font-semibold text-sm py-1 px-2 border-b border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.15)] sticky left-0 z-30 min-w-[180px] bg-[#fffffe] dark:bg-[#262828]">
                  
                </th>
                {dateRange.map((date, index) => {
                  const dayNumber = formatDateHeader(date);
                  return (
                    <th key={index} className="text-center text-[11px] text-[#626c71] dark:text-[rgba(167,169,169,0.7)] font-medium py-1 border-b border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.15)] border-r border-r-[rgba(94,82,64,0.12)] dark:border-r-[rgba(119,124,124,0.15)] w-8 min-w-[32px] sticky top-0 z-10 bg-[#fffffe] dark:bg-[#262828]">
                      {dayNumber}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {user.habits.map((habit, habitIndex) => (
                <tr key={habitIndex}>
                  <td 
                    className="text-left text-sm py-1 px-2 border-b border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.15)] text-[#13343b] dark:text-[#f5f5f5] sticky left-0 bg-[#fffffe] dark:bg-[#262828] z-20 min-w-[200px] max-w-[200px]"
                
                  >
                    {editingHabitIndex === habitIndex ? (
                      <input
                        type="text"
                        value={editingHabitValue}
                        onChange={handleHabitNameChange}
                        onBlur={() => handleHabitNameBlur(habitIndex)}
                        onKeyDown={(e) => handleHabitNameKeyPress(e, habitIndex)}
                        autoFocus
                        className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-green-600 rounded px-1 text-sm text-[#13343b] dark:text-[#f5f5f5]"
                      />
                    ) : (
                      <div
                        onClick={() => isClient && handleHabitNameClick(habitIndex, habit)}
                        onContextMenu={(e) => isClient && handleContextMenu(e, habitIndex, habit)}
                        className={`flex-1 overflow-x-auto whitespace-nowrap ${isClient && !authUser || isViewingOthers ? 'cursor-default' : isClient ? 'cursor-text' : ''} rounded px-1 py-0.5`}
                      >
                        {habit}
                      </div>
                    )}
                  </td>
                  {dateRange.map((date, dateIndex) => {
                    const isCompleted = isHabitCompleted(viewingUser, habit, date);
                    const isFuture = isFutureDate(date);
                    const isPast = isPastDate(date);
                    const isTodayDate = isToday(date);
                    const isDisabled = isViewingOthers || !isTodayDate;
                    const cellId = `cell-${viewingUser}-${habitIndex}-${dateIndex}`;
                    
                    return (
                      <td 
                        key={dateIndex}
                        id={cellId}
                        className={`text-center p-1 border-b border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.15)] border-r border-r-[rgba(94,82,64,0.12)] dark:border-r-[rgba(119,124,124,0.15)] w-8 min-w-[32px] h-[32px] transition-all duration-200 relative
                          ${!isDisabled ? 'cursor-pointer' : 'cursor-not-allowed'}
                        `}
                        onClick={() => !isDisabled && toggleHabitCompletion(habit, date)}
                      >
                          <div className={`w-full h-full rounded transition-all duration-200 relative
                            ${isCompleted ? 'bg-green-700 dark:bg-green-800' : isFuture ? 'bg-black/10' : 'bg-transparent'}
                            ${!isDisabled && !isCompleted ? 'hover:scale-95 hover:shadow-inner hover:bg-gray-100 dark:hover:bg-gray-700/40' : ''}
                            ${isPast && !isCompleted ? 'after:content-[""] after:absolute after:inset-0 after:bg-black/10 after:pointer-events-none after:rounded' : ''}
                            ${isPast && isCompleted ? 'after:content-[""] after:absolute after:inset-0 after:bg-black/20 after:pointer-events-none after:rounded' : ''}
                          `} />
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Productive Hours Row */}
              <tr>
                <td className="text-left text-sm py-1 px-2 text-[#13343b] dark:text-[#f5f5f5] sticky left-0 bg-[#fffffe] dark:bg-[#262828] z-20 min-w-[200px] max-w-[200px] font-semibold">
                  {/* Empty cell for row label */}
                </td>
                {dateRange.map((date, dateIndex) => {
                  const isFuture = isFutureDate(date);
                  const isPast = isPastDate(date);
                  const isTodayDate = isToday(date);
                  const isDisabled = isViewingOthers || !isTodayDate;
                  const hours = getProductiveHours(date);
                  
                  return (
                    <td 
                      key={dateIndex}
                      className="text-center p-0.5 border-r border-r-[rgba(94,82,64,0.12)] dark:border-r-[rgba(119,124,124,0.15)] w-8 min-w-[32px] h-[32px]"
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        value={hours}
                        onChange={(e) => handleProductiveHoursChange(date, e.target.value)}
                        disabled={isDisabled}
                        placeholder={isFuture ? '' : '0'}
                        className={`w-full h-full text-[11px] text-center border-none bg-transparent outline-none text-[#13343b] dark:text-[#f5f5f5] rounded
                          ${!isDisabled ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : 'cursor-not-allowed'}
                          ${isFuture ? 'bg-black/10' : ''}
                          focus:bg-green-50 dark:focus:bg-green-900/20 focus:ring-1 focus:ring-green-600
                        `}
                      />
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        )}

        {/* Mobile Table - Vertical Layout */}
        {!showEmptyState && isClient && (
        <div className="overflow-x-auto md:hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left font-semibold text-xs py-2 px-2 border-b border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.15)] sticky left-0 z-30 bg-[#fffffe] dark:bg-[#262828] min-w-[50px]">
                  Day
                </th>
                {user.habits.map((habit, index) => (
                  <th 
                    key={index} 
                    className="border-b border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.15)] border-r border-r-[rgba(94,82,64,0.12)] dark:border-r-[rgba(119,124,124,0.15)] min-w-[28px] w-7 sticky top-0 z-10 bg-[#fffffe] dark:bg-[#262828] py-2 relative"
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-1">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          isClient && handleHabitNameClick(index, habit);
                        }}
                        onContextMenu={(e) => isClient && handleContextMenu(e, index, habit)}
                        className={`text-[10px] text-[#626c71] dark:text-[rgba(167,169,169,0.7)] font-medium whitespace-nowrap ${isClient && !authUser || isViewingOthers ? 'cursor-default' : isClient ? 'cursor-text' : ''} rounded px-0.5`}
                        style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}
                      >
                        {habit}
                      </span>
                    </div>
                  </th>
                ))}
                {/* Productive Hours Column Header */}
                <th className="border-b border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.15)] border-r border-r-[rgba(94,82,64,0.12)] dark:border-r-[rgba(119,124,124,0.15)] min-w-[28px] w-7 sticky top-0 z-10 bg-[#fffffe] dark:bg-[#262828] py-2">
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px] text-[#626c71] dark:text-[rgba(167,169,169,0.7)] font-medium whitespace-nowrap" style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}>
                      Hrs
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {dateRange.map((date, dateIndex) => {
                const dayNumber = formatDateHeader(date);
                return (
                  <tr key={dateIndex}>
                    <td className="text-left text-xs py-1 px-2 border-b border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.15)] text-[#13343b] dark:text-[#f5f5f5] sticky left-0 bg-[#fffffe] dark:bg-[#262828] z-20 font-medium">
                      {dayNumber}
                    </td>
                    {user.habits.map((habit, habitIndex) => {
                      const isCompleted = isHabitCompleted(viewingUser, habit, date);
                      const isFuture = isFutureDate(date);
                      const isPast = isPastDate(date);
                      const isTodayDate = isToday(date);
                      const isDisabled = isViewingOthers || !isTodayDate;
                      const cellId = `cell-mobile-${viewingUser}-${dateIndex}-${habitIndex}`;
                      
                      return (
                        <td 
                          key={habitIndex}
                          id={cellId}
                          className={`text-center p-1 border-b border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.15)] border-r border-r-[rgba(94,82,64,0.12)] dark:border-r-[rgba(119,124,124,0.15)] w-7 min-w-[28px] h-[28px] transition-all duration-200 relative
                            ${!isDisabled ? 'cursor-pointer' : 'cursor-not-allowed'}
                          `}
                          onClick={() => !isDisabled && toggleHabitCompletion(habit, date)}
                        >
                          <div className={`w-full h-full rounded transition-all duration-200 relative
                            ${isCompleted ? 'bg-green-700 dark:bg-green-800' : isFuture ? 'bg-black/10' : 'bg-transparent'}
                            ${!isDisabled ? 'hover:scale-95 hover:shadow-inner hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                            ${isPast && !isCompleted ? 'after:content-[""] after:absolute after:inset-0 after:bg-black/10 after:pointer-events-none after:rounded' : ''}
                            ${isPast && isCompleted ? 'after:content-[""] after:absolute after:inset-0 after:bg-black/20 after:pointer-events-none after:rounded' : ''}
                          `} />
                        </td>
                      );
                    })}
                    
                    {/* Productive Hours Cell for Mobile */}
                    <td 
                      className="text-center p-0.5 border-r border-r-[rgba(94,82,64,0.12)] dark:border-r-[rgba(119,124,124,0.15)] w-7 min-w-[28px] h-[28px]"
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        value={getProductiveHours(date)}
                        onChange={(e) => handleProductiveHoursChange(date, e.target.value)}
                        disabled={isViewingOthers || !isToday(date)}
                        placeholder={isFutureDate(date) ? '' : '0'}
                        className={`w-full h-full text-[10px] text-center border-none bg-transparent outline-none text-[#13343b] dark:text-[#f5f5f5] rounded
                          ${!(isViewingOthers || !isToday(date)) ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : 'cursor-not-allowed'}
                          ${isFutureDate(date) ? 'bg-black/10' : ''}
                          focus:bg-green-50 dark:focus:bg-green-900/20 focus:ring-1 focus:ring-green-600
                        `}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {/* Mobile Navigation - Below Table */}
        <div className="md:hidden mt-6 flex justify-between items-center px-2">
          <div className="relative user-dropdown">
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-sm text-[#626c71] dark:text-[rgba(167,169,169,0.7)] font-medium cursor-pointer hover:text-[#13343b] dark:hover:text-[#f5f5f5] transition-colors"
            >
              {isClient ? currentUser : '@user'}
            </div>
            
            {showDropdown && (
              <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-[#262828] border border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                {authUser ? (
                  <>
                    <div 
                      onClick={() => {
                        window.location.href = `/#${currentUser.replace('@', '')}`;
                        setShowDropdown(false);
                      }}
                      className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                    >
                      Full Year Preview
                    </div>
                    <Link href="/settings">
                      <div 
                        onClick={() => setShowDropdown(false)}
                        className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                      >
                        Settings
                      </div>
                    </Link>
                    <Link href="/about">
                      <div 
                        onClick={() => setShowDropdown(false)}
                        className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        About
                      </div>
                    </Link>
                    <div className="border-t border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] my-1"></div>
                    <div 
                      onClick={() => {
                        toggleTheme();
                        setShowDropdown(false);
                      }}
                      className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                    </div>
                    <div className="border-t border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] my-1"></div>
                    <div 
                      onClick={() => {
                        signOut();
                        setShowDropdown(false);
                      }}
                      className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                    >
                      Sign out
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/about">
                      <div 
                        onClick={() => setShowDropdown(false)}
                        className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        About
                      </div>
                    </Link>
                    <div className="border-t border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] my-1"></div>
                    <div 
                      onClick={() => {
                        toggleTheme();
                        setShowDropdown(false);
                      }}
                      className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                    </div>
                    <div className="border-t border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] my-1"></div>
                    <div 
                      onClick={() => {
                        setLoginMessage("Sign in to track your own habits and save your progress");
                        setShowLoginModal(true);
                        setShowDropdown(false);
                      }}
                      className="px-3 py-1.5 text-xs text-green-900 dark:text-green-900 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                    >
                      Sign in
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <Link href="/community">
            <div className="text-sm text-[#626c71] dark:text-[rgba(167,169,169,0.7)] font-medium cursor-pointer hover:text-[#13343b] dark:hover:text-[#f5f5f5] transition-colors">
              Community
            </div>
          </Link>
        </div>
      </div>

      {/* Motivational Reminder - Outside Table Block */}
      <div className="mt-10 text-center max-w-2xl">
        <p className="text-xs text-[#626c71] dark:text-[rgba(167,169,169,0.8)] italic transition-all duration-500 whitespace-pre-line">
          {currentReminder}
        </p>
      </div>

      {/* Desktop Navigation - Fixed Position */}
      <div className="relative user-dropdown">
        <div 
          onClick={() => setShowDropdown(!showDropdown)}
          className="hidden md:block fixed bottom-6 left-6 text-sm text-[#626c71] dark:text-[rgba(167,169,169,0.7)] font-medium cursor-pointer hover:text-[#13343b] dark:hover:text-[#f5f5f5] transition-colors"
        >
          {isClient ? currentUser : '@user'}
        </div>
        
        {showDropdown && (
          <div className="hidden md:block fixed bottom-14 left-6 bg-white dark:bg-[#262828] border border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] rounded-lg shadow-lg py-1 min-w-[140px] z-50">
            {authUser ? (
              <>
                <div 
                  onClick={() => {
                    window.location.href = `/#${currentUser.replace('@', '')}`;
                    setShowDropdown(false);
                  }}
                  className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700/40transition-colors cursor-pointer"
                >
                  Full Year Preview
                </div>
                <Link href="/settings">
                  <div 
                    onClick={() => setShowDropdown(false)}
                    className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700/40  transition-colors cursor-pointer"
                  >
                    Settings
                  </div>
                </Link>
                <Link href="/about">
                  <div 
                    onClick={() => setShowDropdown(false)}
                    className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                  >
                    About
                  </div>
                </Link>
                <div className="border-t border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] my-1"></div>
                <div 
                  onClick={() => {
                    toggleTheme();
                    setShowDropdown(false);
                  }}
                  className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                >
                  {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                </div>
                <div className="border-t border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] my-1"></div>
                <div 
                  onClick={() => {
                    signOut();
                    setShowDropdown(false);
                  }}
                  className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                >
                  Sign out
                </div>
              </>
            ) : (
              <>
                <Link href="/about">
                  <div 
                    onClick={() => setShowDropdown(false)}
                    className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                  >
                    About
                  </div>
                </Link>
                <div className="border-t border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] my-1"></div>
                <div 
                  onClick={() => {
                    toggleTheme();
                    setShowDropdown(false);
                  }}
                  className="px-3 py-1.5 text-xs text-[#13343b] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                >
                  {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                </div>
                <div className="border-t border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] my-1"></div>
                <div 
                  onClick={() => {
                    setLoginMessage("Sign in to track your own habits and save your progress");
                    setShowLoginModal(true);
                    setShowDropdown(false);
                  }}
                  className="px-3 py-1.5 text-xs text-green-700 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                >
                  Sign in
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Link href="/community">
        <div 
          className="hidden md:block fixed bottom-6 right-6 text-sm text-[#626c71] dark:text-[rgba(167,169,169,0.7)] font-medium cursor-pointer hover:text-[#13343b] dark:hover:text-[#f5f5f5] transition-colors"
        >
          Community
        </div>
      </Link>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message={loginMessage}
      />

      {/* Welcome Modal for New Users */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffffe] dark:bg-[#262828] rounded-xl border border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] shadow-xl max-w-md w-full p-6 animate-in fade-in duration-200">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium text-[#13343b] dark:text-[#f5f5f5]">
                Welcome to your habits journey 🌱
              </h3>
              <div className="space-y-4 text-sm text-[#626c71] dark:text-[rgba(167,169,169,0.8)] leading-relaxed">
                <p>
                  Click on any habit name to make it yours and rename it to the next habit you want to build.
                </p>
                <p>
                  Ready to add more? Head to <Link href={`/#${authUser?.username?.replace('@', '')}`} className="text-green-700 dark:text-green-600 underline hover:text-green-800 dark:hover:text-green-700">Full Year Preview</Link> to build your path, one habit at a time.
                </p>
                <p>
                  Curious about Camino? Visit the <Link href="/about" className="text-green-700 dark:text-green-600 underline hover:text-green-800 dark:hover:text-green-700">About page</Link> to learn more about this space we&apos;re building together.
                </p>
              </div>
              <button
                onClick={handleWelcomeClose}
                className="mt-4 px-6 py-2 bg-green-700 dark:bg-green-800 text-white text-sm rounded-lg hover:bg-green-800 dark:hover:bg-green-900 transition-colors"
              >
                Let&apos;s begin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu for Deleting Habits */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
          }}
          className="bg-white dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#333333] rounded shadow-sm"
        >
          <button
            onClick={handleDeleteHabit}
            className="block px-2 py-0.5 text-[10px] text-[#4b5563] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-[#f5f5f5] underline transition-colors whitespace-nowrap"
          >
            delete habit
          </button>
        </div>
      )}

      {/* Edit Habit Name Modal - Mobile */}
      {editingHabitIndex !== null && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style={{zIndex: 99999}}>
          <div className="bg-[#fffffe] dark:bg-[#262828] rounded-xl border border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] shadow-xl max-w-xs w-full p-4">
            <label className="block text-xs text-[#626c71] dark:text-[rgba(167,169,169,0.7)] mb-2">
              Edit habit name:
            </label>
            <input
              type="text"
              value={editingHabitValue}
              onChange={handleHabitNameChange}
              onKeyDown={(e) => handleHabitNameKeyPress(e, editingHabitIndex)}
              autoFocus
              className="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] outline-none focus:ring-2 focus:ring-green-600 rounded text-sm text-[#13343b] dark:text-[#f5f5f5]"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleHabitNameSave(editingHabitIndex)}
                className="flex-1 px-4 py-2 bg-green-700 dark:bg-green-800 text-white text-xs rounded-lg hover:bg-green-800 dark:hover:bg-green-900 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingHabitIndex(null);
                  setEditingHabitValue('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-[#13343b] dark:text-[#f5f5f5] text-xs rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
