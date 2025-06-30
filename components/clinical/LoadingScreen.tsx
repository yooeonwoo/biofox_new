'use client';

import React from 'react';
import { LOADING_MESSAGES } from '@/constants/ui';

interface LoadingScreenProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title = LOADING_MESSAGES.general.title,
  description = LOADING_MESSAGES.general.description,
  icon
}) => {
  const defaultIcon = (
    <svg 
      className="w-8 h-8 text-blue-600" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
      />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              {icon || defaultIcon}
            </div>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-gray-600 mb-4">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}; 