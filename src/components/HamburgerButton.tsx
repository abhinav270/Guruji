import React from 'react';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const HamburgerButton: React.FC<HamburgerButtonProps> = ({ isOpen, onClick, className = '' }) => {
  const lineBaseClasses = "h-0.5 w-6 bg-current transition-all duration-300 ease-in-out";

  return (
    <button
      onClick={onClick}
      className={`flex flex-col justify-center items-center space-y-1.5 ${className}`}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      <span
        className={`${lineBaseClasses} ${isOpen ? 'transform rotate-45 translate-y-2' : ''}`}
      ></span>
      <span
        className={`${lineBaseClasses} ${isOpen ? 'opacity-0' : ''}`}
      ></span>
      <span
        className={`${lineBaseClasses} ${isOpen ? 'transform -rotate-45 -translate-y-2' : ''}`}
      ></span>
    </button>
  );
};