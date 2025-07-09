
import React, { forwardRef } from 'react';

const SnakeGameIcon = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div
      ref={ref}
      className="absolute flex flex-col items-center justify-center w-28 h-28"
      style={{ top: '50px', left: '240px' }}
      title="Snake Game"
    >
      <div className="w-20 h-20 bg-gray-800 border-2 border-gray-600 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 8.25V5.25a2.25 2.25 0 00-2.25-2.25H7.5A2.25 2.25 0 005.25 5.25v2.25m4.5 0-3 3m3-3 3 3m-3-3V3M10.5 12.75a2.25 2.25 0 002.25-2.25h.008a2.25 2.25 0 002.25-2.25v-.008a2.25 2.25 0 00-2.25-2.25H9.75a2.25 2.25 0 00-2.25 2.25v.008a2.25 2.25 0 002.25 2.25h.008ZM10.5 12.75h.008a2.25 2.25 0 012.25 2.25v.008a2.25 2.25 0 01-2.25 2.25H9.75a2.25 2.25 0 01-2.25-2.25v-.008a2.25 2.25 0 012.25-2.25H10.5z" />
        </svg>
      </div>
      <span className="text-white mt-2 text-sm drop-shadow-md">Snake</span>
    </div>
  );
});

export default SnakeGameIcon;
