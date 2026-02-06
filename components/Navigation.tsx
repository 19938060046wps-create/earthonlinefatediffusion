
import React from 'react';
import { Screen } from '../types';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate }) => {
  if (currentScreen === Screen.LOGIN) return null;

  const navItems = [
    { id: Screen.CONSOLE, label: '开始' }, // Start
    { id: Screen.MATCH, label: '共鸣' }, // Resonance
    { id: Screen.COMMUNITY, label: '社区' }, // Community
    { id: Screen.PROFILE, label: '我的' }, // Profile
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Background with slight transparency matching app bg */}
      <div className="absolute inset-0 bg-[#F3F4F6]/90 dark:bg-[#050507]/90 backdrop-blur-lg border-t border-gray-200/50 dark:border-white/5"></div>
      
      <nav className="relative flex justify-around items-center h-[80px] pb-4 px-2">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex-1 flex flex-col items-center justify-center py-2 active:scale-95 transition-transform"
            >
              <span className={`text-sm font-medium transition-all duration-300 ${
                isActive 
                  ? 'text-gray-900 dark:text-white font-bold tracking-widest scale-110' 
                  : 'text-gray-400 dark:text-gray-500 font-normal'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="mt-1.5 w-1 h-1 bg-gray-900 dark:bg-white rounded-full"></span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
