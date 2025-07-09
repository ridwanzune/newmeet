
import React, { forwardRef } from 'react';

const ChalkboardIcon = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div
      ref={ref}
      className="absolute flex flex-col items-center justify-center w-28 h-28"
      style={{ top: '60px', left: '80px' }}
      title="Chalkboard"
    >
      <div className="w-20 h-20 bg-green-800 border-2 border-green-600 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
      <span className="text-white mt-2 text-sm drop-shadow-md">Chalkboard</span>
    </div>
  );
});

export default ChalkboardIcon;
