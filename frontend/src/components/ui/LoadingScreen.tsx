import React from 'react';
import { GraduationCap } from 'lucide-react';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center animate-pulse">
        <GraduationCap size={28} className="text-white" />
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-900 dark:text-white">CampusPulse AI</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading...</div>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

export default LoadingScreen;
