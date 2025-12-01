import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../themes';
import { IconTheme, IconCheck } from './icons';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-text-secondary hover:bg-surface hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent"
        aria-label="Select theme TEST"
      >
        <IconTheme />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10 border border-secondary/20">
          {Object.entries(themes).map(([themeKey, themeOption]) => (
            <button
              key={themeKey}
              onClick={() => {
                setTheme(themeKey);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-secondary/30 flex items-center justify-between"
            >
              {themeOption.name}
              {theme.name === themeOption.name && <IconCheck className="w-4 h-4 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
