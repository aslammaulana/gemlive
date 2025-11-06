import React from 'react';

interface ControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`flex items-center justify-center space-x-2 px-6 py-3 font-semibold text-white rounded-full shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
