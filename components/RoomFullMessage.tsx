
import React from 'react';

const RoomFullMessage: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center text-white font-sans">
      <div className="bg-red-500 rounded-full p-4 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold mb-2">Room is Full</h1>
      <p className="text-lg text-gray-300">Sorry, the maximum number of users has been reached.</p>
    </div>
  );
};

export default RoomFullMessage;
