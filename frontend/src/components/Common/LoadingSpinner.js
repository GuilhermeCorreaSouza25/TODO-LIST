import React from 'react';
import './LoadingSpinner.scss';

const LoadingSpinner = ({ size = 'md' }) => {
  return (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner; 